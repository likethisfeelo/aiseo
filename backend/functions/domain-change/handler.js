const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, forbidden, conflict, serverError } = require('../shared/response');
const { requireUser, requireAdmin } = require('../shared/auth');
const crypto = require('crypto');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const SITE_ID_REGEX = /^[a-z0-9-]{3,63}$/;
const RESERVED_IDS = ['b2b', 'site', 'admin', 'api', 'www', 'mail', 'app', 'dev', 'staging', 'prod', 'test'];

/* ── User: Get pending request ── */
const handleGetRequest = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const siteId = event.queryStringParameters?.siteId;
  if (!siteId) return badRequest('siteId is required');

  const site = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!site.Item) return badRequest('Site not found');
  if (site.Item.ownerSub !== user.sub) return forbidden('Not your site');

  return ok({ request: site.Item.domainChangeRequest || null });
};

/* ── User: Submit change request ── */
const handleSubmitRequest = async (event, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const { siteId, requestedSiteId, reason } = parseBody(event);
  if (!siteId || !requestedSiteId) return badRequest('siteId and requestedSiteId are required');
  if (!SITE_ID_REGEX.test(requestedSiteId)) return badRequest('Invalid siteId format');
  if (RESERVED_IDS.includes(requestedSiteId)) return badRequest('Reserved siteId');
  if (requestedSiteId === siteId) return badRequest('Same as current siteId');

  const site = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!site.Item) return badRequest('Site not found');
  if (site.Item.ownerSub !== user.sub) return forbidden('Not your site');

  // Check if requested siteId is already taken
  const target = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId: requestedSiteId } }));
  if (target.Item) return conflict('이미 사용 중인 주소입니다');

  const request = {
    id: crypto.randomUUID(),
    currentSiteId: siteId,
    requestedSiteId,
    reason: reason ? String(reason).slice(0, 500) : '',
    status: 'pending',
    ownerEmail: user.email || site.Item.ownerEmail || '',
    createdAt: new Date().toISOString(),
  };

  await ddb.send(new UpdateCommand({
    TableName: sitesTable,
    Key: { siteId },
    UpdateExpression: 'SET domainChangeRequest = :req, updatedAt = :now',
    ExpressionAttributeValues: {
      ':req': request,
      ':now': new Date().toISOString(),
    },
  }));

  return ok({ request });
};

/* ── Admin: List all pending requests ── */
const handleAdminList = async (event, sitesTable) => {
  const { user, errorResponse } = requireAdmin(event);
  if (errorResponse) return errorResponse;

  const result = await ddb.send(new ScanCommand({
    TableName: sitesTable,
    FilterExpression: 'attribute_exists(domainChangeRequest)',
    ProjectionExpression: 'siteId, ownerEmail, domainChangeRequest',
  }));

  const requests = (result.Items || [])
    .filter((item) => item.domainChangeRequest?.status === 'pending')
    .map((item) => ({
      siteId: item.siteId,
      ownerEmail: item.ownerEmail,
      ...item.domainChangeRequest,
    }))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return ok({ requests });
};

/* ── Admin: Approve request ── */
const handleAdminApprove = async (event, sitesTable) => {
  const { user, errorResponse } = requireAdmin(event);
  if (errorResponse) return errorResponse;

  const { siteId, reviewNote } = parseBody(event);
  if (!siteId) return badRequest('siteId is required');

  const site = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!site.Item) return badRequest('Site not found');
  if (!site.Item.domainChangeRequest) return badRequest('No pending request');

  const req = site.Item.domainChangeRequest;
  if (req.status !== 'pending') return badRequest('Request is not pending');

  const newSiteId = req.requestedSiteId;

  // Check if new siteId is still available
  const target = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId: newSiteId } }));
  if (target.Item) return conflict('요청된 주소가 이미 사용 중입니다');

  // Create new site record with all existing data
  const newItem = { ...site.Item };
  newItem.siteId = newSiteId;
  newItem.domainChangeRequest = {
    ...req,
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewNote: reviewNote ? String(reviewNote).slice(0, 500) : '',
    previousSiteId: siteId,
  };
  newItem.updatedAt = new Date().toISOString();

  // Write new record
  await ddb.send(new PutCommand({
    TableName: sitesTable,
    Item: newItem,
    ConditionExpression: 'attribute_not_exists(siteId)',
  }));

  // Mark old record as deactivated (keep for reference)
  await ddb.send(new UpdateCommand({
    TableName: sitesTable,
    Key: { siteId },
    UpdateExpression: 'SET domainChangeRequest.#s = :status, domainChangeRequest.reviewedAt = :now, domainChangeRequest.reviewNote = :note, deactivated = :deact, deactivatedAt = :now, movedTo = :newId, updatedAt = :now',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':status': 'approved',
      ':now': new Date().toISOString(),
      ':note': reviewNote || '',
      ':deact': true,
      ':newId': newSiteId,
    },
  }));

  return ok({ approved: true, oldSiteId: siteId, newSiteId, message: `도메인이 ${siteId} → ${newSiteId}로 변경되었습니다` });
};

/* ── Admin: Reject request ── */
const handleAdminReject = async (event, sitesTable) => {
  const { user, errorResponse } = requireAdmin(event);
  if (errorResponse) return errorResponse;

  const { siteId, reviewNote } = parseBody(event);
  if (!siteId) return badRequest('siteId is required');

  await ddb.send(new UpdateCommand({
    TableName: sitesTable,
    Key: { siteId },
    UpdateExpression: 'SET domainChangeRequest.#s = :status, domainChangeRequest.reviewedAt = :now, domainChangeRequest.reviewNote = :note, updatedAt = :now',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':status': 'rejected',
      ':now': new Date().toISOString(),
      ':note': reviewNote ? String(reviewNote).slice(0, 500) : '',
    },
  }));

  return ok({ rejected: true, siteId });
};

/* ── Admin: Deactivate old subdomain ── */
const handleAdminDeactivate = async (event, sitesTable) => {
  const { user, errorResponse } = requireAdmin(event);
  if (errorResponse) return errorResponse;

  const { siteId } = parseBody(event);
  if (!siteId) return badRequest('siteId is required');

  const site = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
  if (!site.Item) return badRequest('Site not found');

  await ddb.send(new UpdateCommand({
    TableName: sitesTable,
    Key: { siteId },
    UpdateExpression: 'SET deactivated = :deact, deactivatedAt = :now, updatedAt = :now',
    ExpressionAttributeValues: {
      ':deact': true,
      ':now': new Date().toISOString(),
    },
  }));

  return ok({ deactivated: true, siteId });
};

exports.handler = async (event) => {
  try {
    const sitesTable = process.env.SITES_TABLE;
    if (!sitesTable) return serverError('SITES_TABLE is not configured');

    const method = event.httpMethod || event.requestContext?.http?.method;
    const path = event.path || event.rawPath || '';

    // User routes
    if (method === 'GET' && !path.includes('/admin')) return handleGetRequest(event, sitesTable);
    if (method === 'POST' && !path.includes('/admin')) return handleSubmitRequest(event, sitesTable);

    // Admin routes
    if (method === 'GET' && path.includes('/admin')) return handleAdminList(event, sitesTable);
    if (method === 'POST' && path.endsWith('/approve')) return handleAdminApprove(event, sitesTable);
    if (method === 'POST' && path.endsWith('/reject')) return handleAdminReject(event, sitesTable);
    if (method === 'POST' && path.endsWith('/deactivate')) return handleAdminDeactivate(event, sitesTable);

    return badRequest('Unsupported method');
  } catch (error) {
    console.error('domain-change error', error);
    return serverError('Failed to process domain change request');
  }
};
