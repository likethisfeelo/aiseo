const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const AdmZip = require('adm-zip');
const { ok, badRequest, serverError } = require('../shared/response');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

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

const hasTitle = (html = '') => /<title>[^<]+<\/title>/i.test(html);
const hasMetaDescription = (html = '') =>
  /<meta[^>]+name=["']description["'][^>]*content=["'][^"']+["'][^>]*>/i.test(html);

const normalizeEntry = (value) => String(value).replace(/^\/+/, '').toLowerCase();

const findBySuffix = (entries, suffix) => entries.find((entry) => normalizeEntry(entry).endsWith(suffix));

const buildChecks = ({ entries, indexHtml }) => [
  {
    key: 'index.html',
    passed: Boolean(findBySuffix(entries, 'index.html')),
    reason: 'index.html 존재 여부',
  },
  {
    key: 'robots.txt',
    passed: Boolean(findBySuffix(entries, 'robots.txt')),
    reason: 'robots.txt 존재 여부',
  },
  {
    key: 'sitemap.xml',
    passed: Boolean(findBySuffix(entries, 'sitemap.xml')),
    reason: 'sitemap.xml 존재 여부',
  },
  {
    key: 'title',
    passed: hasTitle(indexHtml),
    reason: 'title 태그 존재 여부',
  },
  {
    key: 'metaDescription',
    passed: hasMetaDescription(indexHtml),
    reason: 'meta description 존재 여부',
  },
];

const readIndexHtml = (zip, entries) => {
  const entryName = findBySuffix(entries, 'index.html');
  if (!entryName) return '';

  const entry = zip.getEntry(entryName);
  if (!entry) return '';

  return zip.readAsText(entry);
};

exports.handler = async (event) => {
  try {
    const reportsTable = process.env.REPORTS_TABLE;
    const uploadBucket = process.env.UPLOAD_BUCKET;

    if (!reportsTable) {
      return serverError('REPORTS_TABLE is not configured');
    }

    if (!uploadBucket) {
      return serverError('UPLOAD_BUCKET is not configured');
    }

    const { siteId, objectKey } = parseBody(event);

    if (!siteId) return badRequest('siteId is required');
    if (!objectKey) return badRequest('objectKey is required');

    const zipObject = await s3.send(
      new GetObjectCommand({
        Bucket: uploadBucket,
        Key: objectKey,
      }),
    );

    if (!zipObject.Body) {
      return serverError('Could not load zip object body');
    }

    const zipBuffer = await streamToBuffer(zipObject.Body);
    const zip = new AdmZip(zipBuffer);

    const entries = zip
      .getEntries()
      .filter((entry) => !entry.isDirectory)
      .map((entry) => entry.entryName);

    const indexHtml = readIndexHtml(zip, entries);
    const checks = buildChecks({ entries, indexHtml });
    const passedCount = checks.filter((v) => v.passed).length;

    const createdAt = new Date().toISOString();
    const report = {
      siteId,
      createdAt,
      objectKey,
      sourceBucket: uploadBucket,
      summary: {
        total: checks.length,
        passed: passedCount,
        failed: checks.length - passedCount,
      },
      checks,
    };

    await ddb.send(
      new PutCommand({
        TableName: reportsTable,
        Item: report,
      }),
    );

    console.log(
      JSON.stringify({
        message: 'validation-complete',
        requestId: event.requestContext?.requestId,
        siteId,
        objectKey,
        createdAt,
        passedCount,
      }),
    );

    return ok(report);
  } catch (error) {
    console.error('validate-site error', error);
    return serverError('Failed to validate site');
  }
};
