const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const USER_USAGE_TABLE = process.env.USER_USAGE_TABLE || 'aiseo-user-usage';

const currentMonthBucket = (now = new Date()) => {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

// Return usage row for user, or an empty default if none exists.
// Also auto-resets monthly counters if monthBucket has rolled over.
const getUsage = async (userSub, { now = new Date(), userCreatedAt } = {}) => {
  if (!userSub) return null;
  const bucket = currentMonthBucket(now);

  let item = null;
  try {
    const result = await ddb.send(
      new GetCommand({
        TableName: USER_USAGE_TABLE,
        Key: { userSub },
      }),
    );
    item = result.Item || null;
  } catch (err) {
    console.warn('usage-tracker: failed to read usage, treating as empty', err?.message || err);
  }

  if (!item) {
    return {
      userSub,
      storageBytes: 0,
      imageCount: 0,
      monthBucket: bucket,
      monthlyDeploys: 0,
      monthlyImagePuts: 0,
      createdAt: userCreatedAt || now.toISOString(),
      updatedAt: now.toISOString(),
      fresh: true,
    };
  }

  // If month rolled over, reset monthly counters on the fly (next write will persist it)
  if (item.monthBucket !== bucket) {
    return {
      ...item,
      monthBucket: bucket,
      monthlyDeploys: 0,
      monthlyImagePuts: 0,
      monthRolledOver: true,
    };
  }

  return item;
};

// Increment counters. `siteId === 'blog'` causes the call to be a no-op
// for per-user quota counters (blog is admin operating asset). We still
// persist the row so createdAt/updatedAt stay in sync.
const incrementUsage = async (
  userSub,
  {
    siteId = null,
    storageBytes = 0,
    imageCount = 0,
    deploy = 0,
    imagePut = 0,
    now = new Date(),
    userCreatedAt,
  } = {},
) => {
  if (!userSub) return null;

  // Blog asset → skip per-user counter bump entirely. Callers may still
  // want to track global blog usage separately via a different table/row.
  // Admin 자원 (blog/library) → usage 카운터 증가 안 함.
  if (siteId === 'blog' || siteId === 'library') return { skipped: true };

  const bucket = currentMonthBucket(now);
  const nowIso = now.toISOString();

  // We use an UpdateExpression with ADD for atomic increments. To handle
  // month rollover we first fetch and reset if the bucket changed.
  try {
    const current = await ddb.send(
      new GetCommand({ TableName: USER_USAGE_TABLE, Key: { userSub } }),
    );
    const existing = current.Item || null;

    const rolledOver = !existing || existing.monthBucket !== bucket;

    if (rolledOver) {
      // Reset monthly counters and apply the increment in a single write.
      await ddb.send(
        new UpdateCommand({
          TableName: USER_USAGE_TABLE,
          Key: { userSub },
          UpdateExpression:
            'SET monthBucket = :b, monthlyDeploys = :md, monthlyImagePuts = :mip, storageBytes = :sb, imageCount = :ic, updatedAt = :u, createdAt = if_not_exists(createdAt, :c)',
          ExpressionAttributeValues: {
            ':b': bucket,
            ':md': deploy,
            ':mip': imagePut,
            ':sb': Math.max(0, (existing?.storageBytes || 0) + storageBytes),
            ':ic': Math.max(0, (existing?.imageCount || 0) + imageCount),
            ':u': nowIso,
            ':c': userCreatedAt || nowIso,
          },
        }),
      );
    } else {
      await ddb.send(
        new UpdateCommand({
          TableName: USER_USAGE_TABLE,
          Key: { userSub },
          UpdateExpression:
            'ADD storageBytes :sb, imageCount :ic, monthlyDeploys :md, monthlyImagePuts :mip SET updatedAt = :u, createdAt = if_not_exists(createdAt, :c), monthBucket = if_not_exists(monthBucket, :b)',
          ExpressionAttributeValues: {
            ':sb': storageBytes,
            ':ic': imageCount,
            ':md': deploy,
            ':mip': imagePut,
            ':u': nowIso,
            ':c': userCreatedAt || nowIso,
            ':b': bucket,
          },
        }),
      );
    }
  } catch (err) {
    console.error('usage-tracker: incrementUsage failed', err?.message || err);
    // Non-fatal; we don't want quota tracking to break live traffic.
  }

  return { ok: true };
};

module.exports = {
  USER_USAGE_TABLE,
  currentMonthBucket,
  getUsage,
  incrementUsage,
};
