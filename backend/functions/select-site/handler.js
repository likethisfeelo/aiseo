const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, conflict, serverError } = require('../shared/response');
const { requireUser } = require('../shared/auth');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const SITE_ID_REGEX = /^[a-z0-9-]{3,63}$/;
const RESERVED_IDS = ['b2b', 'site', 'admin', 'api', 'www', 'mail', 'app', 'dev', 'staging', 'prod', 'test'];

exports.handler = async (event) => {
  try {
    const sitesTable = process.env.SITES_TABLE;
    if (!sitesTable) return serverError('SITES_TABLE is not configured', event);

    const { user, errorResponse } = requireUser(event);
    if (errorResponse) return errorResponse;

    const { siteId } = parseBody(event);
    if (!siteId) return badRequest('siteId is required', event);
    if (!SITE_ID_REGEX.test(siteId)) {
      return badRequest('siteId must be 3-63 chars with lowercase letters, numbers, hyphen', event);
    }
    if (RESERVED_IDS.includes(siteId)) {
      return badRequest('This siteId is reserved and cannot be used', event);
    }

    const existing = await ddb.send(
      new GetCommand({
        TableName: sitesTable,
        Key: { siteId },
      }),
    );

    if (existing.Item) {
      if (existing.Item.ownerSub !== user.sub) {
        return conflict('siteId is already taken', event);
      }

      return ok({
        siteId,
        locked: true,
        alreadyOwned: true,
      }, event);
    }

    const createdAt = new Date().toISOString();

    await ddb.send(
      new PutCommand({
        TableName: sitesTable,
        Item: {
          siteId,
          ownerSub: user.sub,
          ownerEmail: user.email,
          createdAt,
        },
        ConditionExpression: 'attribute_not_exists(siteId)',
      }),
    );

    return ok({
      siteId,
      locked: true,
      alreadyOwned: false,
      createdAt,
    }, event);
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') {
      return conflict('siteId is already taken', event);
    }

    console.error('select-site error', error);
    return serverError('Failed to lock siteId', event);
  }
};
