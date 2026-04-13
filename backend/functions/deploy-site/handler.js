const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { GetObjectCommand, PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const AdmZip = require('adm-zip');
const { ok, badRequest, serverError } = require('../shared/response');
const { requireUser } = require('../shared/auth');
const { ensureSiteOwnership } = require('../shared/site-access');
const { incrementUsage } = require('../shared/usage-tracker');

const s3 = new S3Client({});
const cloudFront = new CloudFrontClient({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

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

const escapeAttr = (str) =>
  String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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

const buildHeadInjection = (snippets) => {
  if (!snippets || typeof snippets !== 'object') return '';
  const parts = [];

  if (snippets.ga4Id) {
    const id = String(snippets.ga4Id).replace(/[^A-Za-z0-9-]/g, '');
    parts.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`);
    parts.push(`<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');</script>`);
  }

  if (snippets.googleAdsId) {
    const id = String(snippets.googleAdsId).replace(/[^A-Za-z0-9-/]/g, '');
    parts.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`);
    parts.push(`<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');</script>`);
  }

  if (snippets.gscMeta) parts.push(String(snippets.gscMeta).slice(0, 500));
  if (snippets.naverMeta) parts.push(String(snippets.naverMeta).slice(0, 500));
  if (snippets.customHead) parts.push(String(snippets.customHead).slice(0, 2000));

  // OG meta tags
  if (snippets.ogTitle) parts.push(`<meta property="og:title" content="${escapeAttr(snippets.ogTitle)}">`);
  if (snippets.ogDescription) parts.push(`<meta property="og:description" content="${escapeAttr(snippets.ogDescription)}">`);
  if (snippets.ogImage) parts.push(`<meta property="og:image" content="${escapeAttr(snippets.ogImage)}">`);
  if (snippets.ogType) parts.push(`<meta property="og:type" content="${escapeAttr(snippets.ogType)}">`);
  if (snippets.metaKeywords) parts.push(`<meta name="keywords" content="${escapeAttr(snippets.metaKeywords)}">`);

  // Twitter Card meta tags (falls back to OG values)
  if (snippets.twitterCard || snippets.ogTitle) {
    parts.push(`<meta name="twitter:card" content="${escapeAttr(snippets.twitterCard || 'summary_large_image')}">`);
  }
  if (snippets.twitterTitle || snippets.ogTitle) {
    parts.push(`<meta name="twitter:title" content="${escapeAttr(snippets.twitterTitle || snippets.ogTitle)}">`);
  }
  if (snippets.twitterDescription || snippets.ogDescription) {
    parts.push(`<meta name="twitter:description" content="${escapeAttr(snippets.twitterDescription || snippets.ogDescription)}">`);
  }
  if (snippets.twitterImage || snippets.ogImage) {
    parts.push(`<meta name="twitter:image" content="${escapeAttr(snippets.twitterImage || snippets.ogImage)}">`);
  }

  // GTM (Google Tag Manager)
  if (snippets.gtmId) {
    const id = String(snippets.gtmId).replace(/[^A-Za-z0-9-]/g, '');
    parts.push(`<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');</script>`);
  }

  // Meta Pixel (Facebook)
  if (snippets.metaPixelId) {
    const id = String(snippets.metaPixelId).replace(/[^0-9]/g, '');
    parts.push(`<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');</script>`);
  }

  // Kakao Pixel
  if (snippets.kakaoPixelId) {
    const id = String(snippets.kakaoPixelId).replace(/[^A-Za-z0-9]/g, '');
    parts.push(`<script>!function(e,t,n,a){if(!e.kakaoPixel){var s=e.kakaoPixel=function(t){s.callMethod?s.callMethod(t):s.queue.push(t)};s.queue=[];var r=t.createElement(n);r.async=!0;r.src=a;var o=t.getElementsByTagName(n)[0];o.parentNode.insertBefore(r,o)}}(window,document,'script','//t1.daumcdn.net/kas/static/kp.js');kakaoPixel('${id}').pageView();</script>`);
  }

  return parts.join('\n');
};

const injectHeadSnippets = (html, injection) => {
  if (!injection) return html;
  if (html.includes('</head>')) {
    return html.replace('</head>', `${injection}\n</head>`);
  }
  if (html.includes('<body')) {
    return html.replace('<body', `${injection}\n<body`);
  }
  return injection + '\n' + html;
};

const loadHeadSnippets = async (siteId, sitesTable) => {
  if (!sitesTable) return '';
  try {
    const result = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
    return buildHeadInjection(result.Item?.headSnippets);
  } catch {
    return '';
  }
};

const uploadZipEntries = async ({ uploadBucket, objectKey, targetBucket, siteId, headInjection }) => {
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
  let uploadedBytes = 0;

  for (const entry of entries) {
    const relativePath = normalizeEntryName(entry.entryName);
    if (!relativePath) continue;

    const targetKey = `${siteId}/${relativePath}`;
    let body = entry.getData();

    if (headInjection && relativePath.toLowerCase().endsWith('.html')) {
      const html = body.toString('utf-8');
      const injected = injectHeadSnippets(html, headInjection);
      body = Buffer.from(injected, 'utf-8');
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: targetBucket,
        Key: targetKey,
        Body: body,
        ContentType: detectContentType(relativePath),
      }),
    );

    uploadedKeys.push(targetKey);
    uploadedBytes += body.length || 0;
  }

  return { uploadedKeys, uploadedBytes };
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

    if (!siteId) return badRequest('siteId is required', event);
    if (!objectKey) return badRequest('objectKey is required', event);
    if (!objectKey.startsWith(`uploads/${siteId}/`)) {
      return badRequest('objectKey does not match siteId', event);
    }
    if (!process.env.UPLOAD_BUCKET) return serverError('UPLOAD_BUCKET is not configured', event);

    const access = await ensureSiteOwnership({
      siteId,
      userSub: user.sub,
      tableName: sitesTable,
      event,
    });
    if (!access.ok) return access.response;

    const resolvedEnv = resolveEnv(env);
    const target = resolveTarget(resolvedEnv);

    if (!target.targetBucket) return serverError('Target sites bucket is not configured', event);
    if (!target.baseDomain) return serverError('Target domain is not configured', event);

    const headInjection = await loadHeadSnippets(siteId, sitesTable);

    const { uploadedKeys, uploadedBytes } = await uploadZipEntries({
      uploadBucket: process.env.UPLOAD_BUCKET,
      objectKey,
      targetBucket: target.targetBucket,
      siteId,
      headInjection,
    });

    if (!uploadedKeys.length) {
      return badRequest('No deployable files found in ZIP', event);
    }

    // Record a successful deploy against the user's monthly quota.
    // Done after upload succeeds so failed attempts don't burn quota.
    // siteId === 'blog' is skipped automatically by incrementUsage.
    try {
      await incrementUsage(user.sub, {
        siteId,
        storageBytes: uploadedBytes,
        deploy: 1,
      });
    } catch (usageErr) {
      console.warn('deploy-site: usage tracking failed', usageErr?.message || usageErr);
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
        uploadedBytes,
        invalidationId,
      }),
    );

    return ok({
      siteId,
      env: resolvedEnv,
      objectKey,
      uploadedCount: uploadedKeys.length,
      uploadedBytes,
      sampleKeys: uploadedKeys.slice(0, 10),
      targetBucket: target.targetBucket,
      invalidationId,
      deployedUrl,
    }, event);
  } catch (error) {
    console.error('deploy-site error', error);
    return serverError('Failed to deploy site', event);
  }
};
