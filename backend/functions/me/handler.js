const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, serverError } = require('../shared/response');
const { requireUser, parseGroupsClaim } = require('../shared/auth');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

exports.handler = async (event) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;
  const claims = user.claims;

  // Use the shared `parseGroupsClaim` helper so we handle every shape
  // API Gateway delivers (array, "name", or "[a b c]" multi-group form).
  // Without this a user with admin + paid_member would land here as one
  // unsplit "[admin paid_member]" entry and the frontend's
  // `groups.includes('paid_member')` check would silently fail.
  const groups = parseGroupsClaim(claims['cognito:groups']);

  const result = {
    user: {
      sub: claims.sub || '',
      email: claims.email || '',
      emailVerified: claims.email_verified === 'true' || claims.email_verified === true,
      name: claims.name || claims['cognito:username'] || '',
      username: claims['cognito:username'] || '',
      groups,
    },
    siteId: null,
  };

  // Find user's site.
  // 한 사용자가 도메인 변경 승인 후 (예: real → best) 두 개의 record 를
  // 갖게 된다. 옛 record 는 deactivated=true 로 마킹되어 있어야 하지만
  // 과거에는 scan 결과 순서가 보장되지 않아서 옛 siteId 가 먼저 잡혀
  // dashboard 의 "현재 사이트"가 비활성 주소로 표시되는 케이스가 있었음.
  // 활성 사이트(가장 최근 updated/created) 를 우선해서 반환한다.
  try {
    const sitesTable = process.env.SITES_TABLE;
    if (sitesTable) {
      const scan = await ddb.send(new ScanCommand({
        TableName: sitesTable,
        FilterExpression: 'ownerSub = :sub',
        ExpressionAttributeValues: { ':sub': user.sub },
        ProjectionExpression: 'siteId, deactivated, createdAt, updatedAt',
        Limit: 20,
      }));
      const items = scan.Items || [];
      if (items.length > 0) {
        const ts = (it) => it.updatedAt || it.createdAt || '';
        // 활성 우선, 그 다음 최신 갱신 순
        items.sort((a, b) => {
          const aDeact = a.deactivated ? 1 : 0;
          const bDeact = b.deactivated ? 1 : 0;
          if (aDeact !== bDeact) return aDeact - bDeact;
          return ts(b).localeCompare(ts(a));
        });
        result.siteId = items[0].siteId;
      }
    }
  } catch (e) {
    console.error('Failed to lookup user site', e);
    // Non-fatal — return user info without siteId
  }

  return ok(result, event);
};
