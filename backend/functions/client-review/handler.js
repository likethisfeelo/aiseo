'use strict';

// ============================================================
// PRISM 클라이언트 검토 스티커 API — 단일 핸들러 / 단일 {proxy+} 라우트
// ------------------------------------------------------------
// 단일 DynamoDB 테이블(aiseo-client-review):
//   - 프로젝트:  pk=PROJECT#<projectId>, sk=META
//   - 스티커:    pk=PROJECT#<projectId>, sk=STICKER#<stickerId>
//
// 인증:
//   - 클라이언트: 프로젝트 비밀번호 검증 후 발급한 HMAC 토큰(Authorization: Bearer)
//   - 어드민:     Cognito ID 토큰을 Lambda 내부에서 aws-jwt-verify 로 검증
//                 (API Gateway authorizer 없이 단일 NONE 프록시 유지 → CFN 리소스 최소화)
// ============================================================

const crypto = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, unauthorized, forbidden, serverError } = require('../shared/response');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.CLIENT_REVIEW_TABLE;

const STICKER_TYPES = ['explanation', 'adjust', 'date-change', 'discussion'];
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7일

// ── helpers ──────────────────────────────────────────────
const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') {
    try { return JSON.parse(event.body); } catch { return {}; }
  }
  return event.body;
};

const subPath = (event) => {
  const p = event.pathParameters && event.pathParameters.proxy;
  if (p) return p.replace(/^\/+|\/+$/g, '');
  const raw = event.path || '';
  return raw.replace(/^\/client-review\/?/, '').replace(/^\/+|\/+$/g, '');
};

const bearer = (event) => {
  const h = (event.headers || {});
  const v = h.Authorization || h.authorization || '';
  return v.startsWith('Bearer ') ? v.slice(7).trim() : v.trim();
};

const projectPk = (projectId) => `PROJECT#${projectId}`;

// ── password (scrypt) ────────────────────────────────────
const hashPassword = (password, salt) => crypto.scryptSync(String(password), salt, 64).toString('hex');
const makeSalt = () => crypto.randomBytes(16).toString('hex');
const verifyPassword = (password, salt, hash) => {
  if (!salt || !hash) return false;
  const a = Buffer.from(hashPassword(password, salt), 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// ── client review token (HMAC) ───────────────────────────
const tokenSecret = () =>
  process.env.REVIEW_TOKEN_SECRET ||
  `${process.env.USER_POOL_ID || ''}:${TABLE || ''}:aiseo-client-review`;

const signToken = (projectId) => {
  const payload = Buffer.from(JSON.stringify({ p: projectId, e: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  const sig = crypto.createHmac('sha256', tokenSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
};

const verifyToken = (token) => {
  if (!token || token.indexOf('.') < 0) return null;
  const [payload, sig] = token.split('.');
  const expSig = crypto.createHmac('sha256', tokenSecret()).update(payload).digest('base64url');
  const sBuf = Buffer.from(sig);
  const eBuf = Buffer.from(expSig);
  if (sBuf.length !== eBuf.length || !crypto.timingSafeEqual(sBuf, eBuf)) return null;
  try {
    const obj = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!obj.e || obj.e < Date.now()) return null;
    return obj; // { p: projectId, e: exp }
  } catch { return null; }
};

// 클라이언트 요청: 토큰이 유효하고 projectId 가 일치하면 통과
const requireReviewToken = (event, projectId) => {
  const claims = verifyToken(bearer(event));
  if (!claims || !projectId || claims.p !== projectId) return false;
  return true;
};

// ── admin (Cognito JWT) ──────────────────────────────────
// Node 내장 crypto 로 RS256 + JWKS 검증 (외부 라이브러리 미사용 → 번들 누락 502 방지)
const poolRegion = () => String(process.env.USER_POOL_ID || '').split('_')[0] || '';
let _jwks = null, _jwksAt = 0;
const getJwks = async () => {
  if (_jwks && Date.now() - _jwksAt < 3600000) return _jwks;
  const url = `https://cognito-idp.${poolRegion()}.amazonaws.com/${process.env.USER_POOL_ID}/.well-known/jwks.json`;
  const res = await fetch(url);
  const j = await res.json();
  _jwks = j.keys || [];
  _jwksAt = Date.now();
  return _jwks;
};
const b64urlJson = (s) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));

const verifyCognitoJwt = async (token) => {
  const parts = String(token).split('.');
  if (parts.length !== 3) throw new Error('malformed');
  const header = b64urlJson(parts[0]);
  const payload = b64urlJson(parts[1]);
  if (!payload.exp || payload.exp * 1000 < Date.now()) throw new Error('expired');
  const iss = `https://cognito-idp.${poolRegion()}.amazonaws.com/${process.env.USER_POOL_ID}`;
  if (payload.iss !== iss) throw new Error('iss');
  const keys = await getJwks();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('kid');
  const pub = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const signed = Buffer.from(parts[0] + '.' + parts[1]);
  const sig = Buffer.from(parts[2], 'base64url');
  if (!crypto.verify('RSA-SHA256', signed, pub, sig)) throw new Error('signature');
  return payload;
};

const requireAdmin = async (event) => {
  if (!process.env.USER_POOL_ID) return false;
  const tok = bearer(event);
  if (!tok) return false;
  try {
    const payload = await verifyCognitoJwt(tok);
    const raw = payload['cognito:groups'] || [];
    const groups = Array.isArray(raw) ? raw : String(raw).split(/[\s,]+/);
    return groups.includes('admin');
  } catch (e) {
    console.error('admin jwt verify failed:', e && e.message);
    return false;
  }
};

const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

// 클라이언트에 노출하면 안 되는 내부 필드 제거
const toClientView = (item) => {
  const { adminChecked, pk, sk, ...rest } = item;
  return rest;
};

// ── route handlers ───────────────────────────────────────
const handleAuth = async (event) => {
  const body = parseBody(event);
  const projectId = str(body.projectId, 100);
  const password = String(body.password || '');
  if (!projectId || !password) return badRequest('projectId 와 password 는 필수입니다.', event);

  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { pk: projectPk(projectId), sk: 'META' } }));
  const project = res.Item;
  if (!project || !verifyPassword(password, project.salt, project.passwordHash)) {
    return unauthorized('비밀번호가 올바르지 않습니다.', event);
  }
  return ok({ token: signToken(projectId), projectId, projectName: project.projectName || projectId }, event);
};

const handleListStickers = async (event) => {
  const projectId = str((event.queryStringParameters || {}).projectId, 100);
  if (!requireReviewToken(event, projectId)) return unauthorized('인증이 필요합니다.', event);

  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :pre)',
    ExpressionAttributeValues: { ':pk': projectPk(projectId), ':pre': 'STICKER#' },
  }));
  const stickers = (res.Items || [])
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
    .map(toClientView);
  return ok({ stickers, count: stickers.length }, event);
};

const handleCreateSticker = async (event) => {
  const body = parseBody(event);
  const projectId = str(body.projectId, 100);
  if (!requireReviewToken(event, projectId)) return unauthorized('인증이 필요합니다.', event);

  const type = STICKER_TYPES.includes(body.type) ? body.type : '';
  const itemId = str(body.itemId, 200);
  if (!type || !itemId) return badRequest('type 과 itemId 는 필수입니다.', event);

  const stickerId = crypto.randomUUID();
  const item = {
    pk: projectPk(projectId),
    sk: `STICKER#${stickerId}`,
    stickerId,
    projectId,
    docId: str(body.docId, 100) || 'default',
    itemId,
    itemLabel: str(body.itemLabel, 300),
    type,
    memo: str(body.memo, 1000),
    desiredDate: str(body.desiredDate, 100),
    authorName: str(body.authorName, 60),
    authorId: str(body.authorId, 100),
    createdAt: new Date().toISOString(),
    adminChecked: false,
  };
  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  return ok({ sticker: toClientView(item) }, event);
};

const handleDeleteSticker = async (event, stickerId) => {
  const q = event.queryStringParameters || {};
  const projectId = str(q.projectId, 100);
  const authorId = str(q.authorId, 100);
  if (!requireReviewToken(event, projectId)) return unauthorized('인증이 필요합니다.', event);
  if (!stickerId) return badRequest('stickerId 가 필요합니다.', event);

  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { pk: projectPk(projectId), sk: `STICKER#${stickerId}` } }));
  const existing = res.Item;
  if (!existing) return ok({ deleted: true }, event); // 이미 없음 → 멱등
  if (!authorId || existing.authorId !== authorId) {
    return forbidden('본인이 작성한 스티커만 삭제할 수 있습니다.', event);
  }
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { pk: projectPk(projectId), sk: `STICKER#${stickerId}` } }));
  return ok({ deleted: true }, event);
};

// ── admin route handlers ─────────────────────────────────
const handleAdminListStickers = async (event) => {
  if (!(await requireAdmin(event))) return forbidden('관리자 권한이 필요합니다.', event);
  const projectId = str((event.queryStringParameters || {}).projectId, 100);
  if (!projectId) return badRequest('projectId 가 필요합니다.', event);

  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :pre)',
    ExpressionAttributeValues: { ':pk': projectPk(projectId), ':pre': 'STICKER#' },
  }));
  const stickers = (res.Items || [])
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .map(({ pk, sk, ...rest }) => rest); // adminChecked 포함 (내부용)
  return ok({ stickers, count: stickers.length }, event);
};

const handleAdminCheck = async (event, stickerId) => {
  if (!(await requireAdmin(event))) return forbidden('관리자 권한이 필요합니다.', event);
  const body = parseBody(event);
  const projectId = str(body.projectId, 100);
  if (!projectId || !stickerId) return badRequest('projectId 와 stickerId 가 필요합니다.', event);

  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { pk: projectPk(projectId), sk: `STICKER#${stickerId}` },
    UpdateExpression: 'SET adminChecked = :c',
    ExpressionAttributeValues: { ':c': !!body.checked },
  }));
  return ok({ stickerId, adminChecked: !!body.checked }, event);
};

const handleAdminUpsertProject = async (event) => {
  if (!(await requireAdmin(event))) return forbidden('관리자 권한이 필요합니다.', event);
  const body = parseBody(event);
  const projectId = str(body.projectId, 100);
  const password = String(body.password || '');
  if (!projectId || !password) return badRequest('projectId 와 password 는 필수입니다.', event);

  const salt = makeSalt();
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      pk: projectPk(projectId),
      sk: 'META',
      projectId,
      projectName: str(body.projectName, 120) || projectId,
      salt,
      passwordHash: hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    },
  }));
  return ok({ projectId }, event);
};

const handleAdminListProjects = async (event) => {
  if (!(await requireAdmin(event))) return forbidden('관리자 권한이 필요합니다.', event);
  // 단일 테이블에서 META 항목만 모은다(프로젝트 = 검토 문서). 비밀번호 해시는 제외.
  const res = await ddb.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: 'sk = :meta',
    ExpressionAttributeValues: { ':meta': 'META' },
    ProjectionExpression: 'projectId, projectName, createdAt',
  }));
  const projects = (res.Items || []).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return ok({ projects, count: projects.length }, event);
};

// ── router ───────────────────────────────────────────────
exports.handler = async (event) => {
  try {
    if (!TABLE) return serverError('CLIENT_REVIEW_TABLE is not configured', event);

    const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
    const segs = subPath(event).split('/').filter(Boolean); // e.g. ['stickers','<id>'] | ['admin','stickers']

    // 클라이언트 라우트
    if (segs[0] === 'auth' && method === 'POST') return handleAuth(event);
    if (segs[0] === 'stickers') {
      if (method === 'GET' && !segs[1]) return handleListStickers(event);
      if (method === 'POST' && !segs[1]) return handleCreateSticker(event);
      if (method === 'DELETE' && segs[1]) return handleDeleteSticker(event, decodeURIComponent(segs[1]));
    }

    // 어드민 라우트
    if (segs[0] === 'admin') {
      if (segs[1] === 'stickers') {
        if (method === 'GET' && !segs[2]) return handleAdminListStickers(event);
        if (method === 'POST' && segs[2] && segs[3] === 'check') return handleAdminCheck(event, decodeURIComponent(segs[2]));
      }
      if (segs[1] === 'projects') {
        if (method === 'GET') return handleAdminListProjects(event);
        if (method === 'POST') return handleAdminUpsertProject(event);
      }
    }

    return badRequest(`Unsupported route: ${method} /${segs.join('/')}`, event);
  } catch (error) {
    console.error('client-review error', error);
    return serverError('Failed to process client-review request', event);
  }
};
