const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { ok, badRequest, serverError } = require('../shared/response');

const s3 = new S3Client({ region: process.env.AWS_REGION });

const ALLOWED_EXTENSION = '.zip';
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 50 * 1024 * 1024);

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const sanitizeFileName = (fileName) => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

exports.handler = async (event) => {
  try {
    const bucket = process.env.UPLOAD_BUCKET;
    if (!bucket) {
      return serverError('UPLOAD_BUCKET is not configured');
    }

    const { siteId, fileName, contentType = 'application/zip', fileSize } = parseBody(event);

    if (!siteId) return badRequest('siteId is required');
    if (!fileName) return badRequest('fileName is required');
    if (!fileName.toLowerCase().endsWith(ALLOWED_EXTENSION)) {
      return badRequest('Only .zip files are allowed');
    }

    if (fileSize && Number(fileSize) > MAX_UPLOAD_BYTES) {
      return badRequest(`File is too large. Max size: ${MAX_UPLOAD_BYTES} bytes`);
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
      maxUploadBytes: MAX_UPLOAD_BYTES,
    });
  } catch (error) {
    console.error('upload-handler error', error);
    return serverError('Failed to create upload URL');
  }
};
