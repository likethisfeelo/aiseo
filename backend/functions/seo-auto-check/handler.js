const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, forbidden, serverError } = require('../shared/response');
const { requireUser } = require('../shared/auth');
const crypto = require('crypto');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

/* ── Naver Search API ── */
const searchNaver = async (keyword, type, clientId, clientSecret) => {
  // type: 'webkr' | 'blog' | 'image'
  const url = `https://openapi.naver.com/v1/search/${type}.json?query=${encodeURIComponent(keyword)}&display=100`;
  try {
    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });
    if (!res.ok) return { items: [], error: `Naver ${type} API error: ${res.status}` };
    const data = await res.json();
    return { items: data.items || [], total: data.total || 0 };
  } catch (e) {
    return { items: [], error: e.message };
  }
};

/* ── Google Custom Search API ── */
const searchGoogle = async (keyword, apiKey, engineId, searchType) => {
  // searchType: undefined for web, 'image' for images
  let url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(keyword)}&num=10`;
  if (searchType) url += `&searchType=${searchType}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) return { items: [], error: 'Google API 일일 한도 초과' };
      return { items: [], error: `Google API error: ${res.status}` };
    }
    const data = await res.json();
    return { items: data.items || [], total: Number(data.searchInformation?.totalResults) || 0 };
  } catch (e) {
    return { items: [], error: e.message };
  }
};

/* ── Find site in results ── */
const findSiteInResults = (items, siteUrl, linkField = 'link') => {
  for (let i = 0; i < items.length; i++) {
    const link = items[i][linkField] || '';
    if (link.includes(siteUrl)) {
      return { found: true, position: i + 1, resultUrl: link };
    }
  }
  return { found: false };
};

/* ── Main Handler ── */
exports.handler = async (event) => {
  try {
    const sitesTable = process.env.SITES_TABLE;
    if (!sitesTable) return serverError('SITES_TABLE is not configured');

    const { user, errorResponse } = requireUser(event);
    if (errorResponse) return errorResponse;

    const { siteId } = parseBody(event);
    if (!siteId) return badRequest('siteId is required');

    const existing = await ddb.send(new GetCommand({ TableName: sitesTable, Key: { siteId } }));
    if (!existing.Item) return badRequest('Site not found');
    if (existing.Item.ownerSub !== user.sub) return forbidden('Not your site');

    const keywords = existing.Item.seoKeywords || [];
    if (keywords.length === 0) return badRequest('추적 키워드를 먼저 설정하세요');

    const siteUrl = `${siteId}.aiseo.tips`;

    // API keys from environment
    const naverClientId = process.env.NAVER_CLIENT_ID || '';
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET || '';
    const googleApiKey = process.env.GOOGLE_CSE_API_KEY || '';
    const googleEngineId = process.env.GOOGLE_CSE_ENGINE_ID || '';

    const hasNaver = naverClientId && naverClientSecret;
    const hasGoogle = googleApiKey && googleEngineId;

    if (!hasNaver && !hasGoogle) {
      return badRequest('검색 API가 설정되지 않았습니다. 관리자에게 문의하세요.');
    }

    const entries = [];
    const results = [];
    const errors = [];

    for (const keyword of keywords) {
      // ── Naver Web ──
      if (hasNaver) {
        const naverWeb = await searchNaver(keyword, 'webkr', naverClientId, naverClientSecret);
        if (naverWeb.error) { errors.push(naverWeb.error); }
        const webResult = findSiteInResults(naverWeb.items, siteUrl);
        const entry = {
          channel: 'naver-search',
          keyword,
          isExposed: webResult.found,
          rank: webResult.position || undefined,
          pageNumber: webResult.position ? Math.ceil(webResult.position / 10) : undefined,
          resultUrl: webResult.resultUrl || undefined,
        };
        entries.push(entry);
        results.push({ keyword, channel: 'naver-search', found: webResult.found, position: webResult.position, resultUrl: webResult.resultUrl });
      }

      // ── Naver Blog ──
      if (hasNaver) {
        const naverBlog = await searchNaver(keyword, 'blog', naverClientId, naverClientSecret);
        if (naverBlog.error) { errors.push(naverBlog.error); }
        const blogResult = findSiteInResults(naverBlog.items, siteUrl);
        entries.push({
          channel: 'naver-blog',
          keyword,
          isExposed: blogResult.found,
          rank: blogResult.position || undefined,
          resultUrl: blogResult.resultUrl || undefined,
          postCount: naverBlog.total || undefined,
        });
        results.push({ keyword, channel: 'naver-blog', found: blogResult.found, position: blogResult.position });
      }

      // ── Naver Image ──
      if (hasNaver) {
        const naverImg = await searchNaver(keyword, 'image', naverClientId, naverClientSecret);
        if (naverImg.error) { errors.push(naverImg.error); }
        const imgResult = findSiteInResults(naverImg.items, siteUrl);
        entries.push({
          channel: 'naver-image',
          keyword,
          isExposed: imgResult.found,
          imageCount: imgResult.found ? 1 : 0,
          resultUrl: imgResult.resultUrl || undefined,
        });
        results.push({ keyword, channel: 'naver-image', found: imgResult.found, position: imgResult.position });
      }

      // ── Google Web ──
      if (hasGoogle) {
        const googleWeb = await searchGoogle(keyword, googleApiKey, googleEngineId);
        if (googleWeb.error) { errors.push(googleWeb.error); hasGoogle && (errors.includes('한도') && false); }
        const gWebResult = findSiteInResults(googleWeb.items, siteUrl);
        entries.push({
          channel: 'google-search',
          keyword,
          isExposed: gWebResult.found,
          rank: gWebResult.position || undefined,
          pageNumber: gWebResult.position ? 1 : undefined,
          resultUrl: gWebResult.resultUrl || undefined,
        });
        results.push({ keyword, channel: 'google-search', found: gWebResult.found, position: gWebResult.position });
      }

      // ── Google Image ──
      if (hasGoogle) {
        const googleImg = await searchGoogle(keyword, googleApiKey, googleEngineId, 'image');
        if (googleImg.error) { errors.push(googleImg.error); }
        const gImgResult = findSiteInResults(googleImg.items, siteUrl);
        entries.push({
          channel: 'google-image',
          keyword,
          isExposed: gImgResult.found,
          imageCount: gImgResult.found ? 1 : 0,
          resultUrl: gImgResult.resultUrl || undefined,
        });
        results.push({ keyword, channel: 'google-image', found: gImgResult.found, position: gImgResult.position });
      }
    }

    // Build snapshot
    const foundCount = results.filter((r) => r.found).length;
    const totalChecks = results.length;
    const now = new Date().toISOString();
    const snapshot = {
      id: crypto.randomUUID(),
      date: now.slice(0, 10),
      entries,
      memo: `${keywords.length}개 키워드 × ${hasNaver && hasGoogle ? 5 : (hasNaver ? 3 : 2)}채널 자동 확인 완료. ${foundCount}/${totalChecks}건 노출 확인.${errors.length > 0 ? ' (일부 API 오류 발생)' : ''}`,
      source: 'automated',
      createdAt: now,
      updatedAt: now,
    };

    // Save to DynamoDB
    const snapshots = existing.Item.seoSnapshots || [];
    snapshots.push(snapshot);

    await ddb.send(new UpdateCommand({
      TableName: sitesTable,
      Key: { siteId },
      UpdateExpression: 'SET seoSnapshots = :snapshots, updatedAt = :now',
      ExpressionAttributeValues: {
        ':snapshots': snapshots,
        ':now': now,
      },
    }));

    return ok({
      snapshot,
      results,
      errors: [...new Set(errors)],
      summary: { keywords: keywords.length, totalChecks, foundCount },
    });
  } catch (error) {
    console.error('seo-auto-check error', error);
    return serverError('Failed to run auto check');
  }
};
