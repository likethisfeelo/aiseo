const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { ok, badRequest, serverError } = require('../shared/response');
const { requireUser } = require('../shared/auth');
const { ensureSiteOwnership } = require('../shared/site-access');
const crypto = require('crypto');

const s3 = new S3Client({});

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
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

    const { siteId, fileName, fileType } = parseBody(event);
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

    return ok({ uploadUrl, objectKey, imageUrl }, event);
  } catch (error) {
    console.error('image-upload-handler error', error);
    return serverError('Failed to generate image upload URL', event);
  }
};
