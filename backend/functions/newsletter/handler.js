const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, serverError } = require('../shared/response');
const { requireAdmin } = require('../shared/auth');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const PERSONAS = new Set(['small-business', 'freelancer', 'startup', 'marketer', 'creator']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const handleSubscribe = async (event) => {
  const body = parseBody(event);
  const email = str(body.email, 200).toLowerCase();
  const personaInput = str(body.persona, 32);
  const persona = PERSONAS.has(personaInput) ? personaInput : '';
  const source = str(body.source, 50) || 'landing-persona';

  if (!email || !EMAIL_RE.test(email)) {
    return badRequest('유효한 이메일을 입력해주세요.', event);
  }

  const createdAt = new Date().toISOString();

  try {
    await ddb.send(new PutCommand({
      TableName: process.env.NEWSLETTER_TABLE,
      Item: { email, persona, source, createdAt, status: 'subscribed' },
      ConditionExpression: 'attribute_not_exists(email)',
    }));
  } catch (err) {
    if (err && err.name === 'ConditionalCheckFailedException') {
      return ok({ email, persona, alreadySubscribed: true }, event);
    }
    throw err;
  }

  return ok({ email, persona }, event);
};

const handleList = async (event) => {
  const { errorResponse } = requireAdmin(event);
  if (errorResponse) return errorResponse;

  const result = await ddb.send(new ScanCommand({ TableName: process.env.NEWSLETTER_TABLE }));
  const subscribers = (result.Items || []).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );
  return ok({ subscribers, count: subscribers.length }, event);
};

exports.handler = async (event) => {
  try {
    if (!process.env.NEWSLETTER_TABLE) {
      return serverError('NEWSLETTER_TABLE is not configured', event);
    }
    const method = event.httpMethod || event.requestContext?.http?.method;
    if (method === 'POST') return handleSubscribe(event);
    if (method === 'GET') return handleList(event);
    return badRequest('Unsupported method', event);
  } catch (error) {
    console.error('newsletter error', error);
    return serverError('Failed to process newsletter request', event);
  }
};
