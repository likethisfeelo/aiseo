const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, serverError } = require('../shared/response');
const { requireAdmin } = require('../shared/auth');
const { randomUUID } = require('crypto');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const EVENT_CODES = ['EVENT_01_FREE', 'EVENT_02_PAID', 'EVENT_03_PAID'];
const EVENT_LABELS = {
  EVENT_01_FREE: 'EVENT 01 · 무료 런칭 파트너',
  EVENT_02_PAID: 'EVENT 02 · 검색 전략 + 배포',
  EVENT_03_PAID: 'EVENT 03 · 콘텐츠 기획 + 배포',
};
const HAS_SITE_VALUES = ['yes', 'no', 'wip'];

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const enumVal = (v, allowed) => (allowed.includes(v) ? v : '');

const sendSlackNotification = async (data) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const eventLabel = EVENT_LABELS[data.eventCode] || data.eventCode;

  const fields = [
    { type: 'mrkdwn', text: `*이름:* ${data.name}` },
    { type: 'mrkdwn', text: `*연락처:* ${data.phone}` },
  ];
  if (data.email) fields.push({ type: 'mrkdwn', text: `*이메일:* ${data.email}` });
  if (data.industry) fields.push({ type: 'mrkdwn', text: `*업종:* ${data.industry}` });
  if (data.region) fields.push({ type: 'mrkdwn', text: `*지역:* ${data.region}` });
  if (data.hasSite) fields.push({ type: 'mrkdwn', text: `*홈페이지 유무:* ${data.hasSite}` });
  if (data.source) fields.push({ type: 'mrkdwn', text: `*출처:* ${data.source}` });

  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: `새 이벤트 신청 — ${eventLabel}` } },
    { type: 'section', fields },
  ];
  if (data.concern) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*한 줄 고민:* ${data.concern}` },
    });
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[${eventLabel}] 새 이벤트 신청: ${data.name} (${data.phone})`,
        blocks,
      }),
    });
  } catch (err) {
    console.error('Slack notification failed', err);
  }
};

const handleSubmit = async (event) => {
  const body = parseBody(event);

  const eventCode = enumVal(str(body.eventCode, 32), EVENT_CODES);
  const name = str(body.name, 100);
  const phone = str(body.phone, 20);
  const email = str(body.email, 200);
  const industry = str(body.industry, 50);
  const region = str(body.region, 50);
  const hasSite = enumVal(str(body.hasSite, 8), HAS_SITE_VALUES);
  const concern = str(body.concern, 2000);
  const source = str(body.source, 50);
  const kakaoConsent = !!body.kakaoConsent;

  if (!eventCode) {
    return badRequest('유효하지 않은 이벤트 코드입니다.', event);
  }
  if (!name || !phone) {
    return badRequest('이름과 연락처는 필수입니다.', event);
  }
  if (!kakaoConsent) {
    return badRequest('카카오톡 연락 동의는 필수입니다.', event);
  }

  const signupId = randomUUID();
  const createdAt = new Date().toISOString();

  const item = {
    signupId,
    createdAt,
    eventCode,
    name,
    phone,
    email,
    industry,
    region,
    hasSite,
    concern,
    kakaoConsent,
    source: source || 'unknown',
    status: 'new',
  };

  await ddb.send(new PutCommand({
    TableName: process.env.EVENT_SIGNUPS_TABLE,
    Item: item,
  }));

  await sendSlackNotification(item);

  return ok({ signupId }, event);
};

const handleList = async (event) => {
  const { errorResponse } = requireAdmin(event);
  if (errorResponse) return errorResponse;

  const result = await ddb.send(new ScanCommand({
    TableName: process.env.EVENT_SIGNUPS_TABLE,
  }));

  const signups = (result.Items || []).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );

  return ok({ signups, count: signups.length }, event);
};

exports.handler = async (event) => {
  try {
    const table = process.env.EVENT_SIGNUPS_TABLE;
    if (!table) return serverError('EVENT_SIGNUPS_TABLE is not configured', event);

    const method = event.httpMethod || event.requestContext?.http?.method;

    if (method === 'POST') return handleSubmit(event);
    if (method === 'GET') return handleList(event);

    return badRequest('Unsupported method', event);
  } catch (error) {
    console.error('event-signup error', error);
    return serverError('Failed to process event signup request', event);
  }
};
