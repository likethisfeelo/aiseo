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

  // 도메인 변경 승인 후 또는 관리자 비활성화 후에는 해당 siteId 로의
  // upload/validate/deploy 를 막아 좀비 재배포를 차단한다. 사용자가
  // 새 siteId 로 옮겼는데 이전 주소로 다시 zip 을 올려서 두 개의
  // 활성 사이트가 만들어지는 케이스의 근본 원인.
  if (item.deactivated) {
    const movedTo = item.movedTo ? ` (현재 주소: ${item.movedTo}.aiseo.tips)` : '';
    return {
      ok: false,
      response: forbidden(`이 사이트(${siteId})는 비활성화되어 있습니다${movedTo}`, event),
    };
  }

  return { ok: true, item };
};

module.exports = {
  ensureSiteOwnership,
};
