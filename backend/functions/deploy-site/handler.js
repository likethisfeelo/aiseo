const { GetObjectCommand, PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const AdmZip = require('adm-zip');
const { ok, badRequest, serverError } = require('../shared/response');
const { requireUser } = require('../shared/auth');
const { ensureSiteOwnership } = require('../shared/site-access');

const s3 = new S3Client({});
const cloudFront = new CloudFrontClient({});

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const streamToBuffer = async (stream) => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

const resolveEnv = (value) => (value === 'prod' ? 'prod' : 'dev');

const resolveTarget = (env) => {
  if (env === 'prod') {
    return {
      targetBucket: process.env.SITES_BUCKET,
      distributionId: process.env.DISTRIBUTION_ID,
      baseDomain: process.env.BASE_DOMAIN,
    };
  }

  return {
    targetBucket: process.env.SITES_BUCKET_DEV,
    distributionId: process.env.DISTRIBUTION_ID_DEV,
    baseDomain: process.env.DEV_DOMAIN,
  };
};

const normalizeEntryName = (entryName) => String(entryName).replace(/^\/+/, '');

const detectContentType = (path) => {
  const lower = path.toLowerCase();

  if (lower.endsWith('.html')) return 'text/html; charset=utf-8';
  if (lower.endsWith('.css')) return 'text/css; charset=utf-8';
  if (lower.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (lower.endsWith('.json')) return 'application/json; charset=utf-8';
  if (lower.endsWith('.xml')) return 'application/xml; charset=utf-8';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.txt')) return 'text/plain; charset=utf-8';

  return 'application/octet-stream';
};

const uploadZipEntries = async ({ uploadBucket, objectKey, targetBucket, siteId }) => {
  const zipObject = await s3.send(
    new GetObjectCommand({
      Bucket: uploadBucket,
      Key: objectKey,
    }),
  );

  if (!zipObject.Body) {
    throw new Error('Could not load zip object body');
  }

  const zipBuffer = await streamToBuffer(zipObject.Body);
  const zip = new AdmZip(zipBuffer);

  const entries = zip.getEntries().filter((entry) => !entry.isDirectory);
  const uploadedKeys = [];

  for (const entry of entries) {
    const relativePath = normalizeEntryName(entry.entryName);
    if (!relativePath) continue;

    const targetKey = `${siteId}/${relativePath}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: targetBucket,
        Key: targetKey,
        Body: entry.getData(),
        ContentType: detectContentType(relativePath),
      }),
    );

    uploadedKeys.push(targetKey);
  }

  return uploadedKeys;
};

const invalidateSite = async ({ distributionId, siteId }) => {
  if (!distributionId) return null;

  const result = await cloudFront.send(
    new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `${siteId}-${Date.now()}`,
        Paths: {
          Quantity: 1,
          Items: [`/${siteId}/*`],
        },
      },
    }),
  );

  return result.Invalidation?.Id || null;
};

exports.handler = async (event) => {
  try {
    const { user, errorResponse } = requireUser(event);
    if (errorResponse) return errorResponse;

    const body = parseBody(event);
    const { siteId, objectKey, env = 'dev' } = body;
    const sitesTable = process.env.SITES_TABLE;

    if (!siteId) return badRequest('siteId is required');
    if (!objectKey) return badRequest('objectKey is required');
    if (!objectKey.startsWith(`uploads/${siteId}/`)) {
      return badRequest('objectKey does not match siteId');
    }
    if (!process.env.UPLOAD_BUCKET) return serverError('UPLOAD_BUCKET is not configured');

    const access = await ensureSiteOwnership({
      siteId,
      userSub: user.sub,
      tableName: sitesTable,
    });
    if (!access.ok) return access.response;

    const resolvedEnv = resolveEnv(env);
    const target = resolveTarget(resolvedEnv);

    if (!target.targetBucket) return serverError('Target sites bucket is not configured');
    if (!target.baseDomain) return serverError('Target domain is not configured');

    const uploadedKeys = await uploadZipEntries({
      uploadBucket: process.env.UPLOAD_BUCKET,
      objectKey,
      targetBucket: target.targetBucket,
      siteId,
    });

    if (!uploadedKeys.length) {
      return badRequest('No deployable files found in ZIP');
    }

    const invalidationId = await invalidateSite({
      distributionId: target.distributionId,
      siteId,
    });

    const deployedUrl = `https://${siteId}.${target.baseDomain}`;

    console.log(
      JSON.stringify({
        message: 'deploy-complete',
        requestId: event.requestContext?.requestId,
        siteId,
        env: resolvedEnv,
        objectKey,
        targetBucket: target.targetBucket,
        uploadedCount: uploadedKeys.length,
        invalidationId,
      }),
    );

    return ok({
      siteId,
      env: resolvedEnv,
      objectKey,
      uploadedCount: uploadedKeys.length,
      sampleKeys: uploadedKeys.slice(0, 10),
      targetBucket: target.targetBucket,
      invalidationId,
      deployedUrl,
    });
  } catch (error) {
    console.error('deploy-site error', error);
    return serverError('Failed to deploy site');
  }
};
