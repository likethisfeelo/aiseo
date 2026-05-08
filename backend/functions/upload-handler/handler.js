const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { ok, badRequest, serverError, payloadTooLarge, tooManyRequests } = require('../shared/response');
const { requireUser } = require('../shared/auth');
const { ensureSiteOwnership } = require('../shared/site-access');
const { getAppConfig, resolveEffectivePolicy, validateUpload, MB } = require('../shared/quota-policy');
const { getUsage } = require('../shared/usage-tracker');

const s3 = new S3Client({ region: process.env.AWS_REGION });

const ALLOWED_EXTENSION = '.zip';
// Legacy env-var fallback; the effective policy takes precedence.
const LEGACY_MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 50 * 1024 * 1024);

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const sanitizeFileName = (fileName) => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

exports.handler = async (event) => {
  try {
    const { user, errorResponse } = requireUser(event);
    if (errorResponse) return errorResponse;

    const bucket = process.env.UPLOAD_BUCKET;
    const sitesTable = process.env.SITES_TABLE;
    if (!bucket) {
      return serverError('UPLOAD_BUCKET is not configured', event);
    }

    const { siteId, fileName, contentType = 'application/zip', fileSize } = parseBody(event);

    if (!siteId) return badRequest('siteId is required', event);
    if (!fileName) return badRequest('fileName is required', event);
    if (!fileName.toLowerCase().endsWith(ALLOWED_EXTENSION)) {
      return badRequest('Only .zip files are allowed', event);
    }

    const access = await ensureSiteOwnership({
      siteId,
      userSub: user.sub,
      tableName: sitesTable,
      event,
    });
    if (!access.ok) return access.response;

    // ── Quota policy check ──
    // Resolve the user's effective policy (training/normal) and verify
    // the ZIP size + monthly deploy count + projected storage.
    const appConfig = await getAppConfig();
    // Some Cognito tokens arrive with a missing or non-numeric `iat`
    // claim. Multiplying NaN through `new Date(NaN).toISOString()`
    // throws `RangeError: Invalid time value` and the whole upload
    // request 500s. Guard against that and let the policy resolver
    // treat the user as "creation date unknown" (= normal policy).
    const iat = Number(user.claims?.iat);
    const userCreatedAt = Number.isFinite(iat) && iat > 0
      ? new Date(iat * 1000).toISOString()
      : undefined;
    const effective = resolveEffectivePolicy(appConfig, { userCreatedAt });
    const usage = await getUsage(user.sub);

    const sizeNumber = fileSize ? Number(fileSize) : 0;
    if (sizeNumber && sizeNumber > LEGACY_MAX_UPLOAD_BYTES) {
      // Keep legacy guard as a defence-in-depth for very old deploys.
      return payloadTooLarge(`File is too large. Max size: ${LEGACY_MAX_UPLOAD_BYTES} bytes`, event);
    }

    const verdict = validateUpload({
      kind: 'site-zip',
      siteId,
      fileSize: sizeNumber,
      usage,
      effective,
    });
    if (!verdict.ok) {
      const body = { code: verdict.code, mode: effective.mode };
      if (verdict.code === 'POLICY_MONTHLY_DEPLOYS') {
        return tooManyRequests(verdict.reason, event, body);
      }
      return payloadTooLarge(verdict.reason, event, body);
    }

    const objectKey = `uploads/${siteId}/${Date.now()}-${sanitizeFileName(fileName)}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    console.log(JSON.stringify({
      message: 'upload-url-created',
      requestId: event.requestContext?.requestId,
      siteId,
      objectKey,
    }));

    return ok({
      uploadUrl,
      objectKey,
      expiresIn: 300,
      maxUploadBytes: effective.policy.maxSiteZipMB * MB,
      policyMode: effective.mode,
    }, event);
  } catch (error) {
    console.error('upload-handler error', error);
    return serverError('Failed to create upload URL', event);
  }
};
