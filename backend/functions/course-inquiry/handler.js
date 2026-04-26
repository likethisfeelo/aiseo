const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, serverError } = require('../shared/response');
const { requireAdmin } = require('../shared/auth');
const { randomUUID } = require('crypto');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const MAX_SERVICES = 50;

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const sanitizeSnapshot = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, MAX_SERVICES).map((s) => ({
    id: str(s?.id, 64),
    code: str(s?.code, 32),
    name: str(s?.name, 200),
    price: Number.isFinite(s?.price) ? Math.max(0, Math.floor(s.price)) : 0,
    priceLabel: str(s?.priceLabel, 50),
  })).filter((s) => s.id);
};

const sanitizeRoute = (r) => {
  if (!r || typeof r !== 'object') return null;
  const id = str(r.id, 8);
  if (!id) return null;
  const estimate = Array.isArray(r.estimate)
    ? r.estimate.slice(0, 20).map((e) => ({
        label: str(e?.label, 200),
        value: str(e?.value, 50),
      })).filter((e) => e.label)
    : [];
  return {
    id,
    title: str(r.title, 200),
    totalEst: str(r.totalEst, 50),
    estimate,
  };
};

const sendSlackNotification = async (data) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const services = (data.servicesSnapshot && data.servicesSnapshot.length > 0)
    ? data.servicesSnapshot.map((s) => `• ${s.code ? s.code + ' ' : ''}${s.name}${s.priceLabel ? ` (${s.priceLabel})` : ''}`).join('\n')
    : (data.selectedServices || []).map((id) => `• ${id}`).join('\n');

  const totalLine = Number.isFinite(data.totalPrice) && data.totalPrice > 0
    ? `\n*합계:* ${data.totalPrice.toLocaleString('ko-KR')}원`
    : '';

  const routePrefix = data.route ? `[경로 ${data.route.id}] ` : '';
  const routeBlocks = data.route
    ? [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*경로:* ${data.route.id}${data.route.title ? ` — ${data.route.title}` : ''}${data.route.totalEst ? `\n*예상 견적:* ${data.route.totalEst}` : ''}`,
          },
        },
        ...(data.route.estimate && data.route.estimate.length > 0
          ? [{
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*추천 항목:*\n${data.route.estimate.map((e) => `• ${e.label}${e.value ? ` — ${e.value}` : ''}`).join('\n')}`,
              },
            }]
          : []),
      ]
    : [];

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${routePrefix}새 수강 상담신청 (Course): ${data.name} (${data.phone})`,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: '새 수강 상담신청 (Course)' } },
          { type: 'section', fields: [
            { type: 'mrkdwn', text: `*이름:* ${data.name}` },
            { type: 'mrkdwn', text: `*연락처:* ${data.phone}` },
            ...(data.email ? [{ type: 'mrkdwn', text: `*이메일:* ${data.email}` }] : []),
            ...(data.source ? [{ type: 'mrkdwn', text: `*출처:* ${data.source}` }] : []),
          ]},
          ...routeBlocks,
          ...(services
            ? [{ type: 'section', text: { type: 'mrkdwn', text: `*선택 서비스:*\n${services}${totalLine}` } }]
            : []),
          ...(data.memo ? [{ type: 'section', text: { type: 'mrkdwn', text: `*메모:* ${data.memo}` } }] : []),
        ],
      }),
    });
  } catch (err) {
    console.error('Slack notification failed', err);
  }
};

const handleSubmit = async (event) => {
  const body = parseBody(event);

  const name = str(body.name, 100);
  const phone = str(body.phone, 20);
  const email = str(body.email, 200);
  const memo = str(body.memo, 2000);
  const source = str(body.source, 50);

  const selectedServices = Array.isArray(body.selectedServices)
    ? body.selectedServices
        .slice(0, MAX_SERVICES)
        .map((s) => str(s, 64))
        .filter(Boolean)
    : [];

  const servicesSnapshot = sanitizeSnapshot(body.servicesSnapshot);
  const route = sanitizeRoute(body.route);

  const totalPrice = Number.isFinite(body.totalPrice)
    ? Math.max(0, Math.floor(body.totalPrice))
    : 0;

  const kakaoConsent = !!body.kakaoConsent;

  if (!name || !phone) {
    return badRequest('이름과 연락처는 필수입니다.', event);
  }
  if (!kakaoConsent) {
    return badRequest('카카오톡 연락 동의는 필수입니다.', event);
  }
  if (selectedServices.length === 0 && !route) {
    return badRequest('서비스를 하나 이상 선택하거나 경로를 선택해주세요.', event);
  }

  const inquiryId = randomUUID();
  const createdAt = new Date().toISOString();

  const item = {
    inquiryId,
    createdAt,
    name,
    phone,
    email,
    memo,
    source: source || 'course',
    selectedServices,
    servicesSnapshot,
    totalPrice,
    kakaoConsent,
    status: 'new',
    ...(route ? { route } : {}),
  };

  await ddb.send(new PutCommand({
    TableName: process.env.COURSE_INQUIRIES_TABLE,
    Item: item,
  }));

  await sendSlackNotification(item);

  return ok({ inquiryId }, event);
};

const handleList = async (event) => {
  const { errorResponse } = requireAdmin(event);
  if (errorResponse) return errorResponse;

  const result = await ddb.send(new ScanCommand({
    TableName: process.env.COURSE_INQUIRIES_TABLE,
  }));

  const inquiries = (result.Items || []).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );

  return ok({ inquiries, count: inquiries.length }, event);
};

exports.handler = async (event) => {
  try {
    const table = process.env.COURSE_INQUIRIES_TABLE;
    if (!table) return serverError('COURSE_INQUIRIES_TABLE is not configured', event);

    const method = event.httpMethod || event.requestContext?.http?.method;

    if (method === 'POST') return handleSubmit(event);
    if (method === 'GET') return handleList(event);

    return badRequest('Unsupported method', event);
  } catch (error) {
    console.error('course-inquiry error', error);
    return serverError('Failed to process course inquiry request', event);
  }
};
