const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, forbidden, serverError } = require('../shared/response');
const { requireUser } = require('../shared/auth');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const sanitizeStore = (input) => {
  if (!input || typeof input !== 'object') return {};
  return {
    address: String(input.address || '').slice(0, 500),
    phone: String(input.phone || '').slice(0, 50),
    hours: typeof input.hours === 'object' ? input.hours : {},
    sns: typeof input.sns === 'object' ? {
      instagram: String((input.sns.instagram) || '').slice(0, 200),
      blog: String((input.sns.blog) || '').slice(0, 500),
      kakao: String((input.sns.kakao) || '').slice(0, 500),
    } : { instagram: '', blog: '', kakao: '' },
    platforms: typeof input.platforms === 'object' ? {
      naverPlace: String((input.platforms.naverPlace) || '').slice(0, 500),
      googleBusiness: String((input.platforms.googleBusiness) || '').slice(0, 500),
      smartStore: String((input.platforms.smartStore) || '').slice(0, 500),
    } : { naverPlace: '', googleBusiness: '', smartStore: '' },
  };
};

const handleGet = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const siteId = event.queryStringParameters?.siteId;
  if (!siteId) return badRequest('siteId query parameter is required', event);

  const result = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!result.Item) return badRequest('Site not found', event);
  if (result.Item.ownerSub !== user.sub) return forbidden('Not your site', event);

  return ok({ store: result.Item.store || {} }, event);
};

const handlePost = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const { siteId, store } = parseBody(event);
  if (!siteId) return badRequest('siteId is required', event);

  const existing = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!existing.Item) return badRequest('Site not found', event);
  if (existing.Item.ownerSub !== user.sub) return forbidden('Not your site', event);

  const sanitized = sanitizeStore(store);

  await ddb.send(new UpdateCommand({
    TableName: sitesTable,
    Key: { siteId },
    UpdateExpression: 'SET store = :store, updatedAt = :now',
    ExpressionAttributeValues: {
      ':store': sanitized,
      ':now': new Date().toISOString(),
    },
  }));

  return ok({ store: sanitized }, event);
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
    console.error('store-handler error', error);
    return serverError('Failed to process store data', event);
  }
};
