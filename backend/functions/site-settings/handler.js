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

const ALLOWED_SNIPPET_KEYS = [
  'ga4Id', 'gscMeta', 'googleAdsId', 'naverMeta', 'customHead',
  'ogTitle', 'ogDescription', 'ogImage', 'ogType', 'metaKeywords',
  'twitterCard', 'twitterTitle', 'twitterDescription', 'twitterImage',
  'gtmId', 'metaPixelId', 'kakaoPixelId', 'kakaoChannelId',
];

const sanitizeSnippets = (input) => {
  if (!input || typeof input !== 'object') return {};
  const result = {};
  for (const key of ALLOWED_SNIPPET_KEYS) {
    if (typeof input[key] === 'string') {
      result[key] = input[key].slice(0, 2000);
    }
  }
  return result;
};

const handleGet = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const siteId = event.queryStringParameters?.siteId;
  if (!siteId) return badRequest('siteId query parameter is required');

  const result = await ddb.send(
    new GetCommand({ TableName: sitesTable, Key: { siteId } }),
  );

  if (!result.Item) return badRequest('Site not found');
  if (result.Item.ownerSub !== user.sub) return forbidden('Not your site');

  return ok({
    siteId: result.Item.siteId,
    headSnippets: result.Item.headSnippets || {},
  });
};

const handlePost = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const { siteId, headSnippets } = parseBody(event);
  if (!siteId) return badRequest('siteId is required');

  const existing = await ddb.send(
    new GetCommand({ TableName: sitesTable, Key: { siteId } }),
  );

  if (!existing.Item) return badRequest('Site not found');
  if (existing.Item.ownerSub !== user.sub) return forbidden('Not your site');

  const sanitized = sanitizeSnippets(headSnippets);

  await ddb.send(
    new UpdateCommand({
      TableName: sitesTable,
      Key: { siteId },
      UpdateExpression: 'SET headSnippets = :snippets, updatedAt = :now',
      ExpressionAttributeValues: {
        ':snippets': sanitized,
        ':now': new Date().toISOString(),
      },
    }),
  );

  return ok({ siteId, headSnippets: sanitized });
};

exports.handler = async (event) => {
  try {
    const sitesTable = process.env.SITES_TABLE;
    if (!sitesTable) return serverError('SITES_TABLE is not configured');

    const method = event.httpMethod || event.requestContext?.http?.method;

    if (method === 'GET') return handleGet(event, sitesTable);
    if (method === 'POST') return handlePost(event, sitesTable);

    return badRequest('Unsupported method');
  } catch (error) {
    console.error('site-settings error', error);
    return serverError('Failed to process site settings');
  }
};
