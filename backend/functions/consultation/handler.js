const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, serverError } = require('../shared/response');
const { requireAdmin } = require('../shared/auth');
const { randomUUID } = require('crypto');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const VALID_SERVICES = ['free', 'content_check', 'ai_consulting'];
const VALID_BUSINESS = ['registered', 'not_registered', 'preparing'];
const VALID_INDUSTRY = ['oneday_class', 'pet', 'handmade', 'custom', 'kids', 'none'];

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const sendSlackNotification = async (data) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const serviceLabels = {
    free: '바로배포+SEO강의(무료)',
    content_check: '바로배포+SEO강의+콘텐츠점검(10만원)',
    ai_consulting: '바로배포+SEO강의+AI컨설팅(20만원)',
  };
  const businessLabels = {
    registered: '있음', not_registered: '없음', preparing: '준비 중',
  };
  const industryLabels = {
    oneday_class: '원데이클래스운영', pet: '반려동물관련',
    handmade: '수제작제품', custom: '맞춤제작',
    kids: '키즈관련', none: '해당없음',
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `새 배포교육 상담신청: ${data.name} (${data.phone})`,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: '새 배포교육 상담신청' } },
          { type: 'section', fields: [
            { type: 'mrkdwn', text: `*이름:* ${data.name}` },
            { type: 'mrkdwn', text: `*연락처:* ${data.phone}` },
            { type: 'mrkdwn', text: `*사업자등록:* ${businessLabels[data.businessRegistered] || data.businessRegistered}` },
            { type: 'mrkdwn', text: `*업종:* ${industryLabels[data.specialIndustry] || data.specialIndustry}` },
          ]},
          { type: 'section', text: { type: 'mrkdwn', text: `*서비스:* ${(data.selectedServices || []).map(s => serviceLabels[s] || s).join(', ')}` } },
        ],
      }),
    });
  } catch (err) {
    console.error('Slack notification failed', err);
  }
};

const handleSubmit = async (event) => {
  const body = parseBody(event);

  const name = (body.name || '').trim().slice(0, 100);
  const phone = (body.phone || '').trim().slice(0, 20);
  const contentConfirmed = !!body.contentConfirmed;
  const selectedServices = Array.isArray(body.selectedServices)
    ? body.selectedServices.filter(s => VALID_SERVICES.includes(s))
    : [];
  const businessRegistered = VALID_BUSINESS.includes(body.businessRegistered)
    ? body.businessRegistered : '';
  const specialIndustry = VALID_INDUSTRY.includes(body.specialIndustry)
    ? body.specialIndustry : '';
  const kakaoConsent = !!body.kakaoConsent;

  if (!name || !phone || !kakaoConsent) {
    return badRequest('이름, 연락처, 카카오톡 연락 동의는 필수입니다.');
  }
  if (selectedServices.length === 0) {
    return badRequest('서비스를 하나 이상 선택해주세요.');
  }

  const consultationId = randomUUID();
  const createdAt = new Date().toISOString();

  const item = {
    consultationId,
    createdAt,
    name,
    phone,
    contentConfirmed,
    selectedServices,
    businessRegistered,
    specialIndustry,
    kakaoConsent,
  };

  await ddb.send(new PutCommand({
    TableName: process.env.CONSULTATIONS_TABLE,
    Item: item,
  }));

  await sendSlackNotification(item);

  return ok({ consultationId });
};

const handleList = async (event) => {
  const { user, errorResponse } = requireAdmin(event);
  if (errorResponse) return errorResponse;

  const result = await ddb.send(new ScanCommand({
    TableName: process.env.CONSULTATIONS_TABLE,
  }));

  const consultations = (result.Items || []).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );

  return ok({ consultations, count: consultations.length });
};

exports.handler = async (event) => {
  try {
    const table = process.env.CONSULTATIONS_TABLE;
    if (!table) return serverError('CONSULTATIONS_TABLE is not configured');

    const method = event.httpMethod || event.requestContext?.http?.method;

    if (method === 'POST') return handleSubmit(event);
    if (method === 'GET') return handleList(event);

    return badRequest('Unsupported method');
  } catch (error) {
    console.error('consultation error', error);
    return serverError('Failed to process consultation request');
  }
};
