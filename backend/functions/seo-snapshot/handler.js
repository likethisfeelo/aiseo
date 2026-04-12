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

const ALLOWED_CHANNELS = [
  'google-search', 'naver-search', 'google-image', 'naver-image',
  'instagram-hashtag', 'naver-blog', 'google-map', 'naver-place',
];

const sanitizeEntry = (input) => {
  if (!input || typeof input !== 'object') return null;
  if (!ALLOWED_CHANNELS.includes(input.channel)) return null;
  const entry = { channel: input.channel };
  if (typeof input.pageNumber === 'number') entry.pageNumber = input.pageNumber;
  if (typeof input.rank === 'number') entry.rank = input.rank;
  if (typeof input.isExposed === 'boolean') entry.isExposed = input.isExposed;
  if (typeof input.imageCount === 'number') entry.imageCount = input.imageCount;
  if (typeof input.postCount === 'number') entry.postCount = input.postCount;
  if (typeof input.reviewCount === 'number') entry.reviewCount = input.reviewCount;
  if (typeof input.starRating === 'number') entry.starRating = input.starRating;
  if (input.note) entry.note = String(input.note).slice(0, 500);
  return entry;
};

const sanitizeSnapshot = (input) => {
  if (!input || typeof input !== 'object') return null;
  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return null;

  const entries = Array.isArray(input.entries)
    ? input.entries.slice(0, 20).map(sanitizeEntry).filter(Boolean)
    : [];

  const images = Array.isArray(input.images)
    ? input.images.slice(0, 10).map((u) => String(u).slice(0, 1000))
    : [];

  const now = new Date().toISOString();
  return {
    id: input.id || crypto.randomUUID(),
    date: input.date,
    entries,
    memo: input.memo ? String(input.memo).slice(0, 1000) : '',
    images,
    source: input.source === 'automated' ? 'automated' : 'manual',
    createdAt: input.createdAt || now,
    updatedAt: now,
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

  const snapshots = (result.Item.seoSnapshots || []).sort((a, b) => b.date.localeCompare(a.date));
  return ok({ snapshots }, event);
};

const handlePost = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const { siteId, snapshot } = parseBody(event);
  if (!siteId) return badRequest('siteId is required', event);

  const existing = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!existing.Item) return badRequest('Site not found', event);
  if (existing.Item.ownerSub !== user.sub) return forbidden('Not your site', event);

  const sanitized = sanitizeSnapshot(snapshot);
  if (!sanitized) return badRequest('Invalid snapshot data (date required, YYYY-MM-DD)', event);

  const snapshots = existing.Item.seoSnapshots || [];
  const idx = snapshots.findIndex((s) => s.id === sanitized.id);
  if (idx >= 0) {
    snapshots[idx] = { ...snapshots[idx], ...sanitized };
  } else {
    snapshots.push(sanitized);
  }

  await ddb.send(new UpdateCommand({
    TableName: sitesTable,
    Key: { siteId },
    UpdateExpression: 'SET seoSnapshots = :snapshots, updatedAt = :now',
    ExpressionAttributeValues: {
      ':snapshots': snapshots,
      ':now': new Date().toISOString(),
    },
  }));

  return ok({ snapshot: sanitized, snapshots: snapshots.sort((a, b) => b.date.localeCompare(a.date)) }, event);
};

const handleDelete = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const { siteId, snapshotId } = parseBody(event);
  if (!siteId || !snapshotId) return badRequest('siteId and snapshotId are required', event);

  const existing = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!existing.Item) return badRequest('Site not found', event);
  if (existing.Item.ownerSub !== user.sub) return forbidden('Not your site', event);

  const snapshots = (existing.Item.seoSnapshots || []).filter((s) => s.id !== snapshotId);

  await ddb.send(new UpdateCommand({
    TableName: sitesTable,
    Key: { siteId },
    UpdateExpression: 'SET seoSnapshots = :snapshots, updatedAt = :now',
    ExpressionAttributeValues: {
      ':snapshots': snapshots,
      ':now': new Date().toISOString(),
    },
  }));

  return ok({ snapshots }, event);
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
    console.error('seo-snapshot error', error);
    return serverError('Failed to process SEO snapshot data', event);
  }
};
