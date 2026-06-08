const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, serverError } = require('../shared/response');
const { requireAdmin } = require('../shared/auth');
const { randomUUID } = require('crypto');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Current online-marketing status options (kept in sync with
// B2BConsultWidget.tsx). Anything outside this set is dropped.
const VALID_MARKETING_STATUS = ['none', 'partial', 'outsourced', 'inhouse'];

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const sendSlackNotification = async (data) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const statusLabels = {
    none: '거의 안 함',
    partial: '일부 운영 중',
    outsourced: '외주 진행 중',
    inhouse: '내부 팀 운영',
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `새 B2B 도입문의: ${data.company} / ${data.contactName} (${data.phone})`,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: '새 B2B 도입문의' } },
          { type: 'section', fields: [
            { type: 'mrkdwn', text: `*회사명:* ${data.company}` },
            { type: 'mrkdwn', text: `*담당자:* ${data.contactName}` },
            { type: 'mrkdwn', text: `*연락처:* ${data.phone}` },
            { type: 'mrkdwn', text: `*업종:* ${data.industry || '-'}` },
            { type: 'mrkdwn', text: `*마케팅 현황:* ${statusLabels[data.marketingStatus] || data.marketingStatus || '-'}` },
          ]},
          ...(data.memo ? [{ type: 'section', text: { type: 'mrkdwn', text: `*문의 메모:* ${data.memo}` } }] : []),
        ],
      }),
    });
  } catch (err) {
    console.error('Slack notification failed', err);
  }
};

const handleSubmit = async (event) => {
  const body = parseBody(event);

  const company = (body.company || '').trim().slice(0, 100);
  const contactName = (body.contactName || '').trim().slice(0, 100);
  const phone = (body.phone || '').trim().slice(0, 20);
  const industry = (body.industry || '').trim().slice(0, 100);
  const marketingStatus = VALID_MARKETING_STATUS.includes(body.marketingStatus)
    ? body.marketingStatus : '';
  const memo = (body.memo || '').trim().slice(0, 1000);
  const consent = !!body.consent;

  if (!company || !contactName || !phone || !consent) {
    return badRequest('회사명, 담당자명, 연락처, 연락 동의는 필수입니다.', event);
  }

  const b2bConsultationId = randomUUID();
  const createdAt = new Date().toISOString();

  const item = {
    b2bConsultationId,
    createdAt,
    company,
    contactName,
    phone,
    industry,
    marketingStatus,
    memo,
    consent,
  };

  await ddb.send(new PutCommand({
    TableName: process.env.B2B_CONSULTATIONS_TABLE,
    Item: item,
  }));

  await sendSlackNotification(item);

  return ok({ b2bConsultationId }, event);
};

const handleList = async (event) => {
  const { errorResponse } = requireAdmin(event);
  if (errorResponse) return errorResponse;

  const result = await ddb.send(new ScanCommand({
    TableName: process.env.B2B_CONSULTATIONS_TABLE,
  }));

  const consultations = (result.Items || []).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );

  return ok({ consultations, count: consultations.length }, event);
};

exports.handler = async (event) => {
  try {
    const table = process.env.B2B_CONSULTATIONS_TABLE;
    if (!table) return serverError('B2B_CONSULTATIONS_TABLE is not configured', event);

    const method = event.httpMethod || event.requestContext?.http?.method;

    if (method === 'POST') return handleSubmit(event);
    if (method === 'GET') return handleList(event);

    return badRequest('Unsupported method', event);
  } catch (error) {
    console.error('b2b-consultation error', error);
    return serverError('Failed to process B2B consultation request', event);
  }
};
