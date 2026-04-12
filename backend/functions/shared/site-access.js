const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { forbidden, serverError } = require('./response');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const ensureSiteOwnership = async ({ siteId, userSub, tableName, event }) => {
  if (!tableName) {
    return { ok: false, response: serverError('SITES_TABLE is not configured', event) };
  }

  const record = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { siteId },
    }),
  );

  const item = record.Item;
  if (!item) {
    return { ok: false, response: forbidden('Site is not locked for this user', event) };
  }

  if (item.ownerSub !== userSub) {
    return { ok: false, response: forbidden('You do not have access to this siteId', event) };
  }

  return { ok: true, item };
};

module.exports = {
  ensureSiteOwnership,
};
