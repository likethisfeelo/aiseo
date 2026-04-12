const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, serverError } = require('../shared/response');
const { requireAdmin } = require('../shared/auth');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const handleList = async (event, sitesTable) => {
  const { user, errorResponse } = requireAdmin(event);
  if (errorResponse) return errorResponse;

  const result = await ddb.send(new ScanCommand({
    TableName: sitesTable,
    ProjectionExpression: 'siteId, ownerSub, ownerEmail, createdAt, updatedAt, brandCompleteness',
  }));

  const sites = (result.Items || []).sort((a, b) =>
    (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')
  );

  return ok({ sites, count: sites.length }, event);
};

const handleGet = async (event, sitesTable) => {
  const { user, errorResponse } = requireAdmin(event);
  if (errorResponse) return errorResponse;

  const siteId = event.queryStringParameters?.siteId;
  if (!siteId) return badRequest('siteId query parameter is required', event);

  const result = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!result.Item) return badRequest('Site not found', event);

  return ok({ site: result.Item }, event);
};

exports.handler = async (event) => {
  try {
    const sitesTable = process.env.SITES_TABLE;
    if (!sitesTable) return serverError('SITES_TABLE is not configured', event);

    const method = event.httpMethod || event.requestContext?.http?.method;
    const path = event.path || event.rawPath || '';

    if (method === 'GET' && event.queryStringParameters?.siteId) return handleGet(event, sitesTable);
    if (method === 'GET') return handleList(event, sitesTable);

    return badRequest('Unsupported method', event);
  } catch (error) {
    console.error('admin-sites error', error);
    return serverError('Failed to process admin sites request', event);
  }
};
