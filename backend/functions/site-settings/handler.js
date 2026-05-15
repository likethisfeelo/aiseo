const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, forbidden, serverError } = require('../shared/response');
const { requireUser, isAdmin } = require('../shared/auth');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const ALLOWED_SNIPPET_KEYS = [
  'ga4Id', 'gscMeta', 'googleAdsId', 'naverMeta', 'customHead',
  'ogTitle', 'ogDescription', 'ogImage', 'ogType', 'metaKeywords',
  'twitterCard', 'twitterTitle', 'twitterDescription', 'twitterImage',
  'gtmId', 'metaPixelId', 'kakaoPixelId', 'kakaoChannelId',
];

// 사용자가 GSC 토큰만 paste 해도, 또는 정식 meta 태그를 paste 해도
// 동일한 한 줄짜리 meta 형태로 정규화한다. <script> 같은 다른 태그가
// 끼는 사고를 차단하기 위해 형식을 엄격히 검사한다.
// 거절 케이스: 다중 태그, script/link/style, content 토큰의 비정상 길이/문자,
// google-site-verification 이외의 name 값.
class GscMetaInvalidError extends Error {
  constructor() { super('GSC_META_INVALID'); this.name = 'GscMetaInvalidError'; }
}

const normalizeGscMeta = (raw) => {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (!s) return '';
  // 토큰만 paste 한 경우 — 그대로 감싸기
  if (/^[A-Za-z0-9_-]{30,80}$/.test(s)) {
    return `<meta name="google-site-verification" content="${s}">`;
  }
  // 정식 한-줄짜리 meta 태그만 허용
  const m = s.match(/^<meta\s+name="google-site-verification"\s+content="([A-Za-z0-9_-]{30,80})"\s*\/?>$/);
  if (m) return `<meta name="google-site-verification" content="${m[1]}">`;
  throw new GscMetaInvalidError();
};

const sanitizeSnippets = (input) => {
  if (!input || typeof input !== 'object') return {};
  const result = {};
  for (const key of ALLOWED_SNIPPET_KEYS) {
    if (typeof input[key] !== 'string') continue;
    if (key === 'gscMeta') {
      // throws — 호출부에서 잡아서 400 으로 변환
      result[key] = normalizeGscMeta(input[key]);
      continue;
    }
    result[key] = input[key].slice(0, 2000);
  }
  return result;
};

const handleGet = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const siteId = event.queryStringParameters?.siteId;
  if (!siteId) return badRequest('siteId query parameter is required', event);

  const result = await ddb.send(
    new GetCommand({ TableName: sitesTable, Key: { siteId } }),
  );

  if (!result.Item) return badRequest('Site not found', event);
  if (result.Item.ownerSub !== user.sub && !isAdmin(event)) {
    return forbidden('Not your site', event);
  }

  return ok({
    siteId: result.Item.siteId,
    headSnippets: result.Item.headSnippets || {},
    seoKeywords: result.Item.seoKeywords || [],
  }, event);
};

const handlePost = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const { siteId, headSnippets, seoKeywords } = parseBody(event);
  if (!siteId) return badRequest('siteId is required', event);

  const existing = await ddb.send(
    new GetCommand({ TableName: sitesTable, Key: { siteId } }),
  );

  if (!existing.Item) return badRequest('Site not found', event);
  // 관리자는 다른 사용자의 사이트 settings 도 수정·롤백 할 수 있다
  // (admin dashboard 의 head-snippets clear 액션). 일반 사용자는 본인 소유만.
  if (existing.Item.ownerSub !== user.sub && !isAdmin(event)) {
    return forbidden('Not your site', event);
  }

  const updateParts = ['updatedAt = :now'];
  const exprValues = { ':now': new Date().toISOString() };

  let sanitized;
  if (headSnippets) {
    try {
      sanitized = sanitizeSnippets(headSnippets);
    } catch (err) {
      if (err instanceof GscMetaInvalidError) {
        return badRequest('GSC 메타 태그 형식이 올바르지 않습니다. 본인 사이트의 google-site-verification 토큰만, 또는 정식 한-줄짜리 meta 태그만 등록할 수 있습니다.', event);
      }
      throw err;
    }
    updateParts.push('headSnippets = :snippets');
    exprValues[':snippets'] = sanitized;
  }

  if (Array.isArray(seoKeywords)) {
    const sanitizedKw = seoKeywords.slice(0, 10).map((k) => String(k).slice(0, 50)).filter(Boolean);
    updateParts.push('seoKeywords = :keywords');
    exprValues[':keywords'] = sanitizedKw;
  }

  await ddb.send(
    new UpdateCommand({
      TableName: sitesTable,
      Key: { siteId },
      UpdateExpression: 'SET ' + updateParts.join(', '),
      ExpressionAttributeValues: exprValues,
    }),
  );

  return ok({
    siteId,
    headSnippets: headSnippets ? sanitized : (existing.Item.headSnippets || {}),
    seoKeywords: Array.isArray(seoKeywords) ? seoKeywords.slice(0, 10).map((k) => String(k).slice(0, 50)).filter(Boolean) : (existing.Item.seoKeywords || []),
  }, event);
};

exports.handler = async (event) => {
  try {
    const sitesTable = process.env.SITES_TABLE;
    if (!sitesTable) return serverError('SITES_TABLE is not configured', event);

    const method = event.httpMethod || event.requestContext?.http?.method;

    if (method === 'GET') return handleGet(event, sitesTable);
    if (method === 'POST') return handlePost(event, sitesTable);

    return badRequest('Unsupported method', event);
  } catch (error) {
    console.error('site-settings error', error);
    return serverError('Failed to process site settings', event);
  }
};
