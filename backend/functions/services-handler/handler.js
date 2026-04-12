const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, forbidden, serverError } = require('../shared/response');
const { requireUser } = require('../shared/auth');
const crypto = require('crypto');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const sanitizeService = (input) => {
  if (!input || typeof input !== 'object') return null;
  return {
    id: input.id || crypto.randomUUID(),
    name: String(input.name || '').slice(0, 200),
    type: String(input.type || '').slice(0, 100),
    price: Number(input.price) || 0,
    description: String(input.description || '').slice(0, 5000),
    schedule: String(input.schedule || '').slice(0, 500),
    createdAt: input.createdAt || new Date().toISOString(),
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

  return ok({ services: result.Item.services || [] }, event);
};

const handlePost = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const { siteId, service } = parseBody(event);
  if (!siteId) return badRequest('siteId is required', event);
  if (!service || !service.name) return badRequest('Service name is required', event);

  const existing = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!existing.Item) return badRequest('Site not found', event);
  if (existing.Item.ownerSub !== user.sub) return forbidden('Not your site', event);

  const sanitized = sanitizeService(service);
  const services = existing.Item.services || [];

  const idx = services.findIndex((s) => s.id === sanitized.id);
  if (idx >= 0) {
    services[idx] = { ...services[idx], ...sanitized };
  } else {
    services.push(sanitized);
  }

  await ddb.send(new UpdateCommand({
    TableName: sitesTable,
    Key: { siteId },
    UpdateExpression: 'SET services = :services, updatedAt = :now',
    ExpressionAttributeValues: {
      ':services': services,
      ':now': new Date().toISOString(),
    },
  }));

  return ok({ service: sanitized, services }, event);
};

const handleDelete = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const { siteId, serviceId } = parseBody(event);
  if (!siteId || !serviceId) return badRequest('siteId and serviceId are required', event);

  const existing = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!existing.Item) return badRequest('Site not found', event);
  if (existing.Item.ownerSub !== user.sub) return forbidden('Not your site', event);

  const services = (existing.Item.services || []).filter((s) => s.id !== serviceId);

  await ddb.send(new UpdateCommand({
    TableName: sitesTable,
    Key: { siteId },
    UpdateExpression: 'SET services = :services, updatedAt = :now',
    ExpressionAttributeValues: {
      ':services': services,
      ':now': new Date().toISOString(),
    },
  }));

  return ok({ services }, event);
};

exports.handler = async (event) => {
  try {
    const sitesTable = process.env.SITES_TABLE;
    if (!sitesTable) return serverError('SITES_TABLE is not configured', event);

    const method = event.httpMethod || event.requestContext?.http?.method;
    const path = event.path || event.rawPath || '';

    if (method === 'GET') return handleGet(event, sitesTable);
    if (method === 'POST' && path.endsWith('/delete')) return handleDelete(event, sitesTable);
    if (method === 'POST') return handlePost(event, sitesTable);

    return badRequest('Unsupported method', event);
  } catch (error) {
    console.error('services-handler error', error);
    return serverError('Failed to process service data', event);
  }
};
