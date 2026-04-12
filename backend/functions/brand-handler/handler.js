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

const BRAND_FIELDS = ['name', 'nameEn', 'tagline', 'industry', 'businessType', 'colors', 'tone', 'logo', 'story', 'target'];

const sanitizeBrand = (input) => {
  if (!input || typeof input !== 'object') return {};
  const result = {};
  for (const key of BRAND_FIELDS) {
    if (input[key] !== undefined) {
      if (typeof input[key] === 'string') {
        result[key] = input[key].slice(0, 5000);
      } else {
        result[key] = input[key];
      }
    }
  }
  return result;
};

const calcCompleteness = (brand) => {
  if (!brand) return 0;
  const fields = [brand.name, brand.nameEn, brand.tagline, brand.industry, brand.businessType, brand.logo];
  const story = brand.story || {};
  const target = brand.target || {};
  const storyFields = [story.origin, story.values];
  const targetFields = [target.audience];
  const all = [...fields, ...storyFields, ...targetFields];
  const filled = all.filter(Boolean).length;
  const hasColors = (brand.colors || []).length > 0 ? 1 : 0;
  const hasTone = (brand.tone || []).length > 0 ? 1 : 0;
  const hasKeywords = ((target.keywords) || []).length > 0 ? 1 : 0;
  return Math.round(((filled + hasColors + hasTone + hasKeywords) / 12) * 100);
};

const handleGet = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const siteId = event.queryStringParameters?.siteId;
  if (!siteId) return badRequest('siteId query parameter is required', event);

  const result = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!result.Item) return badRequest('Site not found', event);
  if (result.Item.ownerSub !== user.sub) return forbidden('Not your site', event);

  return ok({
    brand: result.Item.brand || {},
    brandCompleteness: result.Item.brandCompleteness || 0,
  }, event);
};

const handlePost = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const { siteId, brand } = parseBody(event);
  if (!siteId) return badRequest('siteId is required', event);

  const existing = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!existing.Item) return badRequest('Site not found', event);
  if (existing.Item.ownerSub !== user.sub) return forbidden('Not your site', event);

  const sanitized = sanitizeBrand(brand);
  const completeness = calcCompleteness(sanitized);

  await ddb.send(new UpdateCommand({
    TableName: sitesTable,
    Key: { siteId },
    UpdateExpression: 'SET brand = :brand, brandCompleteness = :comp, updatedAt = :now',
    ExpressionAttributeValues: {
      ':brand': sanitized,
      ':comp': completeness,
      ':now': new Date().toISOString(),
    },
  }));

  return ok({ brand: sanitized, brandCompleteness: completeness }, event);
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
    console.error('brand-handler error', error);
    return serverError('Failed to process brand data', event);
  }
};
