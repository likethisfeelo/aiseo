const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, serverError } = require('../shared/response');
const { requireUser } = require('../shared/auth');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

exports.handler = async (event) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;
  const claims = user.claims;

  const rawGroups = claims['cognito:groups'];
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : typeof rawGroups === 'string'
      ? rawGroups.split(',').map((g) => g.trim()).filter(Boolean)
      : [];

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
