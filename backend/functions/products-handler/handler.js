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

const sanitizeProduct = (input) => {
  if (!input || typeof input !== 'object') return null;
  return {
    id: input.id || crypto.randomUUID(),
    name: String(input.name || '').slice(0, 200),
    price: Number(input.price) || 0,
    description: String(input.description || '').slice(0, 5000),
    channels: Array.isArray(input.channels) ? input.channels.slice(0, 10).map((c) => String(c).slice(0, 100)) : [],
    imageUrl: String(input.imageUrl || '').slice(0, 1000),
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

  return ok({ products: result.Item.products || [] }, event);
};

const handlePost = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const { siteId, product } = parseBody(event);
  if (!siteId) return badRequest('siteId is required', event);
  if (!product || !product.name) return badRequest('Product name is required', event);

  const existing = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!existing.Item) return badRequest('Site not found', event);
  if (existing.Item.ownerSub !== user.sub) return forbidden('Not your site', event);

  const sanitized = sanitizeProduct(product);
  const products = existing.Item.products || [];

  const idx = products.findIndex((p) => p.id === sanitized.id);
  if (idx >= 0) {
    products[idx] = { ...products[idx], ...sanitized };
  } else {
    products.push(sanitized);
  }

  await ddb.send(new UpdateCommand({
    TableName: sitesTable,
    Key: { siteId },
    UpdateExpression: 'SET products = :products, updatedAt = :now',
    ExpressionAttributeValues: {
      ':products': products,
      ':now': new Date().toISOString(),
    },
  }));

  return ok({ product: sanitized, products }, event);
};

const handleDelete = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const { siteId, productId } = parseBody(event);
  if (!siteId || !productId) return badRequest('siteId and productId are required', event);

  const existing = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!existing.Item) return badRequest('Site not found', event);
  if (existing.Item.ownerSub !== user.sub) return forbidden('Not your site', event);

  const products = (existing.Item.products || []).filter((p) => p.id !== productId);

  await ddb.send(new UpdateCommand({
    TableName: sitesTable,
    Key: { siteId },
    UpdateExpression: 'SET products = :products, updatedAt = :now',
    ExpressionAttributeValues: {
      ':products': products,
      ':now': new Date().toISOString(),
    },
  }));

  return ok({ products }, event);
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
    console.error('products-handler error', error);
    return serverError('Failed to process product data', event);
  }
};
