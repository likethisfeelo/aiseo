const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, forbidden, serverError } = require('../shared/response');
const { requireUser } = require('../shared/auth');
const { ensureSiteOwnership } = require('../shared/site-access');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const handleGet = async (event, commentsTable, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const siteId = event.queryStringParameters?.siteId;
  if (!siteId) return badRequest('siteId query parameter is required', event);

  const { ok: isOwner, response: ownerErr } = await ensureSiteOwnership({
    siteId, userSub: user.sub, tableName: sitesTable, event,
  });
  if (!isOwner) return ownerErr;

  const targetType = event.queryStringParameters?.targetType || null;
  const targetId = event.queryStringParameters?.targetId || null;

  const result = await ddb.send(new QueryCommand({
    TableName: commentsTable,
    KeyConditionExpression: 'siteId = :siteId',
    ExpressionAttributeValues: { ':siteId': siteId },
    ScanIndexForward: false, // newest first
  }));

  let comments = result.Items || [];

  // Filter by targetType/targetId if provided
  if (targetType) comments = comments.filter((c) => c.targetType === targetType);
  if (targetId) comments = comments.filter((c) => c.targetId === targetId);

  const unreadCount = comments.filter((c) => !c.isRead).length;

  return ok({ comments, unreadCount }, event);
};

const handleMarkRead = async (event, commentsTable, sitesTable) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;

  const { siteId, commentIds } = parseBody(event);
  if (!siteId) return badRequest('siteId is required', event);
  if (!Array.isArray(commentIds) || commentIds.length === 0) return badRequest('commentIds array is required', event);

  const { ok: isOwner, response: ownerErr } = await ensureSiteOwnership({
    siteId, userSub: user.sub, tableName: sitesTable, event,
  });
  if (!isOwner) return ownerErr;

  // Mark each comment as read
  const updates = commentIds.slice(0, 50).map((commentId) =>
    ddb.send(new UpdateCommand({
      TableName: commentsTable,
      Key: { siteId, commentId },
      UpdateExpression: 'SET isRead = :read',
      ExpressionAttributeValues: { ':read': true },
    })).catch(() => {}) // ignore individual failures
  );

  await Promise.all(updates);

  return ok({ updated: commentIds.length }, event);
};

exports.handler = async (event) => {
  try {
    const commentsTable = process.env.COMMENTS_TABLE;
    const sitesTable = process.env.SITES_TABLE;
    if (!commentsTable) return serverError('COMMENTS_TABLE is not configured', event);
    if (!sitesTable) return serverError('SITES_TABLE is not configured', event);

    const method = event.httpMethod || event.requestContext?.http?.method;
    const path = event.path || event.rawPath || '';

    if (method === 'GET') return handleGet(event, commentsTable, sitesTable);
    if (method === 'POST' && path.endsWith('/read')) return handleMarkRead(event, commentsTable, sitesTable);

    return badRequest('Unsupported method', event);
  } catch (error) {
    console.error('comments error', error);
    return serverError('Failed to process comments request', event);
  }
};
