const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { ok, badRequest, serverError, payloadTooLarge, tooManyRequests } = require('../shared/response');
const { requireUser } = require('../shared/auth');
const { ensureSiteOwnership } = require('../shared/site-access');
const { getAppConfig, resolveEffectivePolicy, validateUpload, MB } = require('../shared/quota-policy');
const { getUsage, incrementUsage } = require('../shared/usage-tracker');
const crypto = require('crypto');

const s3 = new S3Client({});

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const EXT_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

exports.handler = async (event) => {
  try {
    const bucket = process.env.IMAGES_BUCKET;
    const sitesTable = process.env.SITES_TABLE;
    const imagesCdnDomain = process.env.IMAGES_CDN_DOMAIN || '';

    if (!bucket) return serverError('IMAGES_BUCKET is not configured', event);
    if (!sitesTable) return serverError('SITES_TABLE is not configured', event);

    const { user, errorResponse } = requireUser(event);
    if (errorResponse) return errorResponse;

    const { siteId, fileName, fileType, fileSize } = parseBody(event);
    if (!siteId) return badRequest('siteId is required', event);
    if (!fileName) return badRequest('fileName is required', event);
    if (!fileType || !ALLOWED_TYPES.includes(fileType)) {
      return badRequest('Unsupported file type. Allowed: JPEG, PNG, WebP, SVG', event);
    }

    const { ok: isOwner, response: ownerErr } = await ensureSiteOwnership({
      siteId,
      userSub: user.sub,
      tableName: sitesTable,
      event,
    });
    if (!isOwner) return ownerErr;

    // ── Quota policy check ──
    // Blog images (siteId === 'blog') are admin operating resources and
    // therefore only subject to absolute hard caps, not per-user quotas.
    const appConfig = await getAppConfig();
    // Defensive iat parse — see upload-handler/handler.js for why; some
    // Cognito tokens have a missing or non-numeric `iat` and the naive
    // `new Date(NaN).toISOString()` throws RangeError.
    const iat = Number(user.claims?.iat);
    const userCreatedAt = Number.isFinite(iat) && iat > 0
      ? new Date(iat * 1000).toISOString()
      : undefined;
    const effective = resolveEffectivePolicy(appConfig, { userCreatedAt });
    const usage = siteId === 'blog' ? null : await getUsage(user.sub);

    const sizeNumber = fileSize ? Number(fileSize) : 0;
    const verdict = validateUpload({
      kind: 'image',
      siteId,
      fileSize: sizeNumber,
      usage,
      effective,
    });
    if (!verdict.ok) {
      const body = { code: verdict.code, mode: effective.mode };
      if (verdict.code === 'POLICY_MONTHLY_IMAGE_PUTS') {
        return tooManyRequests(verdict.reason, event, body);
      }
      return payloadTooLarge(verdict.reason, event, body);
    }

    const ext = EXT_MAP[fileType] || '.bin';
    const objectKey = `${siteId}/${crypto.randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    const imageUrl = imagesCdnDomain
      ? `https://${imagesCdnDomain}/${objectKey}`
      : `https://${bucket}.s3.amazonaws.com/${objectKey}`;

    // Optimistically bump usage counters for non-blog uploads. We do this
    // at presign time because the client PUTs directly to S3 without our
    // Lambda in the loop. Tracking the signed-URL issuance is the only
    // hook we have; slight over-counting on abandoned uploads is OK.
    if (siteId !== 'blog') {
      try {
        await incrementUsage(user.sub, {
          siteId,
          imageCount: 1,
          imagePut: 1,
          storageBytes: sizeNumber || 0,
        });
      } catch (usageErr) {
        console.warn('image-upload: usage tracking failed', usageErr?.message || usageErr);
      }
    }

    return ok(
      {
        uploadUrl,
        objectKey,
        imageUrl,
        policyMode: effective.mode,
        maxImageBytes: effective.policy.maxImageMB * MB,
        resize: effective.policy.imageResize || null,
      },
      event,
    );
  } catch (error) {
    console.error('image-upload-handler error', error);
    return serverError('Failed to generate image upload URL', event);
  }
};
