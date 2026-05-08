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

  // Find user's site
  try {
    const sitesTable = process.env.SITES_TABLE;
    if (sitesTable) {
      const scan = await ddb.send(new ScanCommand({
        TableName: sitesTable,
        FilterExpression: 'ownerSub = :sub',
        ExpressionAttributeValues: { ':sub': user.sub },
        ProjectionExpression: 'siteId',
        Limit: 10,
      }));
      if (scan.Items && scan.Items.length > 0) {
        result.siteId = scan.Items[0].siteId;
      }
    }
  } catch (e) {
    console.error('Failed to lookup user site', e);
    // Non-fatal — return user info without siteId
  }

  return ok(result, event);
};
