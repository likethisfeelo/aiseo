const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, serverError } = require('../shared/response');
const { requireAdmin } = require('../shared/auth');
const { randomUUID } = require('crypto');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const EVENT_CODES = [
  'EVENT_01_FREE',
  'EVENT_02_PAID',
  'EVENT_03_PAID',
  'EVENT_04_PAID',
  'EVENT_05_PET_PHOTO',
];
const EVENT_LABELS = {
  EVENT_01_FREE: 'EVENT 01 · 무료 런칭 파트너',
  EVENT_02_PAID: 'EVENT 02 · 검색 전략 + 배포',
  EVENT_03_PAID: 'EVENT 03 · 콘텐츠 기획 + 배포',
  EVENT_04_PAID: 'EVENT 04 · 풀패키지 (첫완성)',
  EVENT_05_PET_PHOTO: 'EVENT 05 · 반려동물 사진작가 특별 (10만원)',
};
const HAS_SITE_VALUES = ['yes', 'no', 'wip'];

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const enumVal = (v, allowed) => (allowed.includes(v) ? v : '');

// ── 희망 교육 일정 (ScheduleRequestWidget) ──
// 위젯은 회차별로 { session, label, date, hour } 를 보낸다. 시간은
// "hour 시 ~ hour+1 시" 1시간 단위. 위젯 기본값(08~23시)보다 넓게
// 허용해 두고, 실제 범위 제한은 프론트 위젯 props 가 담당한다.
const MAX_SLOTS = 6;
const SLOT_HOUR_MIN = 0;
const SLOT_HOUR_MAX = 23;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

const parseSlots = (raw) => {
  if (!Array.isArray(raw)) return [];
  const slots = [];
  for (const item of raw.slice(0, MAX_SLOTS)) {
    if (!item || typeof item !== 'object') continue;
    const date = str(item.date, 10);
    const hour = Number(item.hour);
    if (!DATE_RE.test(date) || Number.isNaN(Date.parse(date))) continue;
    if (!Number.isInteger(hour) || hour < SLOT_HOUR_MIN || hour > SLOT_HOUR_MAX) continue;
    const session = Number.isInteger(Number(item.session)) ? Number(item.session) : slots.length + 1;
    const label = str(item.label, 30) || `${session}회차`;
    slots.push({ session, label, date, hour });
  }
  return slots;
};

const pad2 = (n) => String(n).padStart(2, '0');
const formatSlot = (slot) => {
  // 'YYYY-MM-DD' 를 UTC 자정으로 파싱하면 getUTCDay() 가 그 달력 날짜의 요일.
  const d = new Date(`${slot.date}T00:00:00Z`);
  const weekday = Number.isNaN(d.getTime()) ? '' : ` (${WEEKDAY_KO[d.getUTCDay()]})`;
  return `${slot.label} · ${slot.date}${weekday} ${pad2(slot.hour)}:00~${pad2(slot.hour + 1)}:00`;
};


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
  if (data.privacyConsent) fields.push({ type: 'mrkdwn', text: '*개인정보 동의:* 동의함' });

  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: `새 이벤트 신청 — ${eventLabel}` } },
    { type: 'section', fields },
  ];
  if (Array.isArray(data.preferredSlots) && data.preferredSlots.length > 0) {
    const lines = data.preferredSlots.map((slot) => `• ${formatSlot(slot)}`).join('\n');
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*희망 교육 일정:*\n${lines}\n_입력된 전화번호의 카카오톡으로 연락 필요_` },
    });
  }
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
  const privacyConsent = !!body.privacyConsent;
  const preferredSlots = parseSlots(body.preferredSlots);

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
    privacyConsent,
    preferredSlots,
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
