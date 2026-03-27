const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, serverError } = require('../shared/response');
const { requireAdmin } = require('../shared/auth');
const crypto = require('crypto');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const VALID_TARGET_TYPES = ['brand', 'product', 'service', 'store', 'site', 'general'];
const VALID_COMMENT_TYPES = ['opinion', 'suggestion', 'correction'];

exports.handler = async (event) => {
  try {
    const commentsTable = process.env.COMMENTS_TABLE;
    if (!commentsTable) return serverError('COMMENTS_TABLE is not configured');

    const { user, errorResponse } = requireAdmin(event);
    if (errorResponse) return errorResponse;

    const method = event.httpMethod || event.requestContext?.http?.method;
    if (method !== 'POST') return badRequest('Unsupported method');

    const body = parseBody(event);
    const { siteId, targetType, targetId, targetField, type, content, suggestedValue } = body;

    if (!siteId) return badRequest('siteId is required');
    if (!targetType || !VALID_TARGET_TYPES.includes(targetType)) return badRequest('Invalid targetType');
    if (!type || !VALID_COMMENT_TYPES.includes(type)) return badRequest('Invalid comment type');
    if (!content || typeof content !== 'string' || content.trim().length === 0) return badRequest('content is required');

    const now = new Date().toISOString();
    const commentId = `${now}#${crypto.randomUUID()}`;

    const comment = {
      siteId,
      commentId,
      targetType,
      targetId: targetId || null,
      targetField: targetField || null,
      authorSub: user.sub,
      authorEmail: user.email,
      authorName: user.username || user.email,
      type,
      content: content.trim().slice(0, 5000),
      suggestedValue: suggestedValue ? String(suggestedValue).slice(0, 5000) : null,
      createdAt: now,
      isRead: false,
    };

    await ddb.send(new PutCommand({ TableName: commentsTable, Item: comment }));

    return ok({ comment });
  } catch (error) {
    console.error('admin-comment error', error);
    return serverError('Failed to create comment');
  }
};
