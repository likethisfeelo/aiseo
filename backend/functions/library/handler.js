// ============================================================
// AI SEO Library — covers + posts + cover↔post join API.
// ------------------------------------------------------------
// Three DynamoDB tables back this Lambda:
//   1. aiseo-library-covers      (PK=slug)            표지/카테고리
//   2. aiseo-library-posts       (PK=slug)            챕터/포스트
//   3. aiseo-library-cover-posts (PK=coverSlug, SK=sortKey, GSI postSlug-index)
//                                                     N:N + cover별 순서
//
// Routes (see infra/cdk/lib/cdk-stack.ts for the API GW wiring):
//   Public
//     GET    /library/covers
//     GET    /library/covers/{slug}                cover + 정렬된 chapters
//     GET    /library/posts/{slug}?cover=...       post + siblings + canonical
//   Admin
//     GET    /admin/library/covers
//     POST   /admin/library/covers
//     GET    /admin/library/covers/{slug}
//     PUT    /admin/library/covers/{slug}
//     DELETE /admin/library/covers/{slug}          cover 삭제 + 매핑 cleanup
//     PUT    /admin/library/covers/{slug}/chapters bulk reorder/replace
//                                                  body: { chapters: [postSlug,…] }
//     GET    /admin/library/posts
//     POST   /admin/library/posts
//     GET    /admin/library/posts/{slug}           post + coverSlugs[]
//     PUT    /admin/library/posts/{slug}           post + coverSlugs[] sync
//     DELETE /admin/library/posts/{slug}
//
// The admin "edit cover → drag chapters" UX uses the bulk
// reorder endpoint, which atomically rewrites the cover's
// chapter list (delete-then-put) inside one BatchWrite cycle.
// ============================================================

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
  BatchWriteCommand,
} = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, serverError, conflict } = require('../shared/response');
const { requireAdmin } = require('../shared/auth');
const { sanitizeLibraryHtml } = require('./sanitize');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const SLUG_RE = /^[a-z0-9-]+$/;
const MAX_CHAPTERS_PER_COVER = 200;

// ── Helpers ────────────────────────────────────────────────────────────────

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const boolOf = (v) => v === true || v === 'true';

const numOf = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);

const isSlug = (s) => typeof s === 'string' && s.length > 0 && s.length <= 100 && SLUG_RE.test(s);

const pad4 = (n) => String(Math.max(0, Math.min(9999, Math.floor(n)))).padStart(4, '0');

// `0042#nxn` — sortable lex-key with stable postSlug suffix. Pad
// keeps the lexicographic order numeric without needing a number
// SK (BatchWrite is awkward with composite types).
const buildSortKey = (sortOrder, postSlug) => `${pad4(sortOrder)}#${postSlug}`;

const scanAll = async (TableName, ExtraParams = {}) => {
  const items = [];
  let ExclusiveStartKey;
  do {
    const result = await ddb.send(new ScanCommand({ TableName, ExclusiveStartKey, ...ExtraParams }));
    if (result.Items) items.push(...result.Items);
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
};

const queryAll = async (params) => {
  const items = [];
  let ExclusiveStartKey;
  do {
    const result = await ddb.send(new QueryCommand({ ...params, ExclusiveStartKey }));
    if (result.Items) items.push(...result.Items);
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
};

const stripPostBody = (p) => {
  if (!p) return p;
  const { bodyHtml: _b, ...rest } = p;
  return rest;
};

const stripPostFull = (p) => {
  // For the public reader sidebar — keep just enough to render
  // the chapter list (title, tag, reading time, slug).
  if (!p) return p;
  return {
    slug: p.slug,
    title: p.title || '',
    tag: p.tag || '',
    readMinutes: p.readMinutes || 0,
    canonicalCoverSlug: p.canonicalCoverSlug || '',
    isPublished: p.isPublished !== false,
  };
};

const tables = (env) => ({
  covers: env.LIBRARY_COVERS_TABLE,
  posts: env.LIBRARY_POSTS_TABLE,
  joins: env.LIBRARY_COVER_POSTS_TABLE,
});

const ensureTables = (T, event) => {
  if (!T.covers || !T.posts || !T.joins) {
    return serverError('Library tables not configured', event);
  }
  return null;
};

// ── Join-table helpers ─────────────────────────────────────────────────────

const listChapters = async (T, coverSlug) =>
  queryAll({
    TableName: T.joins,
    KeyConditionExpression: 'coverSlug = :c',
    ExpressionAttributeValues: { ':c': coverSlug },
  });

const listCoversForPost = async (T, postSlug) =>
  queryAll({
    TableName: T.joins,
    IndexName: 'postSlug-index',
    KeyConditionExpression: 'postSlug = :p',
    ExpressionAttributeValues: { ':p': postSlug },
  });

// Delete every join row for one cover. Used on cover delete and on
// bulk-reorder (delete-then-put). DynamoDB BatchWrite caps at 25 per
// request, so chunk it.
const deleteAllChaptersOfCover = async (T, coverSlug) => {
  const rows = await listChapters(T, coverSlug);
  for (let i = 0; i < rows.length; i += 25) {
    const slice = rows.slice(i, i + 25);
    await ddb.send(new BatchWriteCommand({
      RequestItems: {
        [T.joins]: slice.map((r) => ({
          DeleteRequest: { Key: { coverSlug: r.coverSlug, sortKey: r.sortKey } },
        })),
      },
    }));
  }
};

const deleteAllJoinsOfPost = async (T, postSlug) => {
  const rows = await listCoversForPost(T, postSlug);
  for (let i = 0; i < rows.length; i += 25) {
    const slice = rows.slice(i, i + 25);
    await ddb.send(new BatchWriteCommand({
      RequestItems: {
        [T.joins]: slice.map((r) => ({
          DeleteRequest: { Key: { coverSlug: r.coverSlug, sortKey: r.sortKey } },
        })),
      },
    }));
  }
};

const writeChapters = async (T, coverSlug, postSlugs) => {
  const items = postSlugs.slice(0, MAX_CHAPTERS_PER_COVER).map((postSlug, idx) => ({
    coverSlug,
    sortKey: buildSortKey(idx + 1, postSlug),
    postSlug,
    sortOrder: idx + 1,
  }));
  for (let i = 0; i < items.length; i += 25) {
    const slice = items.slice(i, i + 25);
    await ddb.send(new BatchWriteCommand({
      RequestItems: {
        [T.joins]: slice.map((it) => ({ PutRequest: { Item: it } })),
      },
    }));
  }
};

// ── Cover handlers ─────────────────────────────────────────────────────────

const buildCoverItem = (body, base = {}) => {
  const nowIso = new Date().toISOString();
  return {
    ...base,
    title: str(body.title, 300),
    description: str(body.description, 1000),
    thumbnail: str(body.thumbnail, 1000),
    tag: str(body.tag, 60),
    sortOrder: Number.isFinite(body.sortOrder) ? Math.floor(body.sortOrder) : 9999,
    isPublished: boolOf(body.isPublished),
    updatedAt: nowIso,
  };
};

const publicListCovers = async (event, T) => {
  const all = await scanAll(T.covers);
  const visible = all
    .filter((c) => c.isPublished)
    .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
  return ok({ covers: visible }, event);
};

const publicGetCover = async (event, T) => {
  const slug = str(event.pathParameters?.slug, 100);
  if (!isSlug(slug)) return badRequest('Invalid slug', event);

  const coverRes = await ddb.send(new GetCommand({ TableName: T.covers, Key: { slug } }));
  const cover = coverRes.Item;
  if (!cover || !cover.isPublished) return badRequest('Cover not found', event);

  // Join → chapter slugs (already sorted by sortKey thanks to the SK)
  const joins = await listChapters(T, slug);
  // Hydrate from posts table — only published posts surface publicly.
  const chapters = [];
  for (const j of joins) {
    const pr = await ddb.send(new GetCommand({ TableName: T.posts, Key: { slug: j.postSlug } }));
    const p = pr.Item;
    if (p && p.isPublished !== false) {
      chapters.push({ ...stripPostFull(p), lead: str(p.lead, 400), sortOrder: j.sortOrder });
    }
  }

  return ok({ cover, chapters }, event);
};

const adminListCovers = async (event, T) => {
  const all = await scanAll(T.covers);
  const covers = all.sort((a, b) =>
    (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999)
    || (a.title || '').localeCompare(b.title || ''),
  );
  return ok({ covers, count: covers.length }, event);
};

const adminGetCover = async (event, T) => {
  const slug = str(event.pathParameters?.slug, 100);
  if (!isSlug(slug)) return badRequest('Invalid slug', event);

  const coverRes = await ddb.send(new GetCommand({ TableName: T.covers, Key: { slug } }));
  if (!coverRes.Item) return badRequest('Cover not found', event);

  const joins = await listChapters(T, slug);
  // Admin needs the full chapter list (including unpublished posts).
  const chapters = [];
  for (const j of joins) {
    const pr = await ddb.send(new GetCommand({ TableName: T.posts, Key: { slug: j.postSlug } }));
    if (pr.Item) chapters.push({ ...stripPostFull(pr.Item), sortOrder: j.sortOrder });
    else chapters.push({ slug: j.postSlug, title: '(삭제됨)', tag: '', readMinutes: 0, sortOrder: j.sortOrder, missing: true });
  }
  return ok({ cover: coverRes.Item, chapters }, event);
};

const adminCreateCover = async (event, T) => {
  const body = parseBody(event);
  const slug = str(body.slug, 100);
  if (!isSlug(slug)) return badRequest('Invalid slug (영문 소문자·숫자·하이픈)', event);
  if (!str(body.title, 300)) return badRequest('제목은 필수입니다.', event);

  const existing = await ddb.send(new GetCommand({ TableName: T.covers, Key: { slug } }));
  if (existing.Item) return conflict('이미 존재하는 표지 slug 입니다.', event);

  const nowIso = new Date().toISOString();
  const item = buildCoverItem(body, { slug, createdAt: nowIso });
  await ddb.send(new PutCommand({ TableName: T.covers, Item: item }));
  return ok({ cover: item }, event);
};

const adminUpdateCover = async (event, T) => {
  const slug = str(event.pathParameters?.slug, 100);
  if (!isSlug(slug)) return badRequest('Invalid slug', event);

  const body = parseBody(event);
  if (!str(body.title, 300)) return badRequest('제목은 필수입니다.', event);

  const current = await ddb.send(new GetCommand({ TableName: T.covers, Key: { slug } }));
  if (!current.Item) return badRequest('Cover not found', event);

  const item = buildCoverItem(body, {
    slug,
    createdAt: current.Item.createdAt || new Date().toISOString(),
  });
  await ddb.send(new PutCommand({ TableName: T.covers, Item: item }));
  return ok({ cover: item }, event);
};

const adminDeleteCover = async (event, T) => {
  const slug = str(event.pathParameters?.slug, 100);
  if (!isSlug(slug)) return badRequest('Invalid slug', event);

  await deleteAllChaptersOfCover(T, slug);
  await ddb.send(new DeleteCommand({ TableName: T.covers, Key: { slug } }));
  return ok({ slug, deleted: true }, event);
};

const adminReorderChapters = async (event, T) => {
  const coverSlug = str(event.pathParameters?.slug, 100);
  if (!isSlug(coverSlug)) return badRequest('Invalid slug', event);

  const body = parseBody(event);
  const rawChapters = Array.isArray(body.chapters) ? body.chapters : [];
  // Accept either ["slug-a", "slug-b"] or [{postSlug:"slug-a"}, …].
  const postSlugs = [];
  const seen = new Set();
  for (const c of rawChapters) {
    const ps = typeof c === 'string' ? c.trim() : str(c?.postSlug, 100);
    if (isSlug(ps) && !seen.has(ps)) {
      seen.add(ps);
      postSlugs.push(ps);
    }
  }

  // Make sure the cover exists before nuking + rewriting the join.
  const coverRes = await ddb.send(new GetCommand({ TableName: T.covers, Key: { slug: coverSlug } }));
  if (!coverRes.Item) return badRequest('Cover not found', event);

  await deleteAllChaptersOfCover(T, coverSlug);
  await writeChapters(T, coverSlug, postSlugs);

  return ok({ coverSlug, chapters: postSlugs.map((postSlug, idx) => ({ postSlug, sortOrder: idx + 1 })) }, event);
};

// ── Post handlers ──────────────────────────────────────────────────────────

const buildPostItem = (body, base = {}) => {
  const nowIso = new Date().toISOString();
  // bodyHtml goes through allow-list, then is capped at 300KB so a
  // single item never exceeds DynamoDB's 400KB hard limit.
  const sanitized = sanitizeLibraryHtml(typeof body.bodyHtml === 'string' ? body.bodyHtml : '').slice(0, 300000);
  const seoMetaRaw = body.seoMeta && typeof body.seoMeta === 'object' ? body.seoMeta : {};
  const seoMeta = {
    description: str(seoMetaRaw.description, 500),
    keywords: str(seoMetaRaw.keywords, 300),
    ogTitle: str(seoMetaRaw.ogTitle, 200),
    ogDescription: str(seoMetaRaw.ogDescription, 400),
    ogImage: str(seoMetaRaw.ogImage, 1000),
  };

  return {
    ...base,
    title: str(body.title, 300),
    tag: str(body.tag, 60),
    author: str(body.author, 100) || 'AISEO',
    publishedAt: str(body.publishedAt, 40) || nowIso,
    readMinutes: Number.isFinite(body.readMinutes) ? Math.max(0, Math.floor(body.readMinutes)) : numOf(body.readMinutes, 4),
    lead: str(body.lead, 800),
    bodyHtml: sanitized,
    canonicalCoverSlug: str(body.canonicalCoverSlug, 100),
    seoMeta,
    isPublished: boolOf(body.isPublished),
    updatedAt: nowIso,
  };
};

const publicGetPost = async (event, T) => {
  const slug = str(event.pathParameters?.slug, 100);
  if (!isSlug(slug)) return badRequest('Invalid slug', event);

  const pr = await ddb.send(new GetCommand({ TableName: T.posts, Key: { slug } }));
  const post = pr.Item;
  if (!post || post.isPublished === false) return badRequest('Post not found', event);

  // Cover context — caller passes ?cover=... so we know which
  // sidebar/canonical to render. Falls back to canonicalCoverSlug.
  const qs = event.queryStringParameters || {};
  const requestedCover = isSlug(str(qs.cover, 100)) ? qs.cover : '';
  const canonicalCoverSlug = isSlug(post.canonicalCoverSlug || '') ? post.canonicalCoverSlug : '';
  const activeCover = requestedCover || canonicalCoverSlug || '';

  let cover = null;
  let siblings = [];
  if (activeCover) {
    const cr = await ddb.send(new GetCommand({ TableName: T.covers, Key: { slug: activeCover } }));
    if (cr.Item && cr.Item.isPublished) {
      cover = cr.Item;
      const joins = await listChapters(T, activeCover);
      for (const j of joins) {
        const sp = await ddb.send(new GetCommand({ TableName: T.posts, Key: { slug: j.postSlug } }));
        if (sp.Item && sp.Item.isPublished !== false) {
          siblings.push({ ...stripPostFull(sp.Item), sortOrder: j.sortOrder });
        }
      }
    }
  }

  return ok({
    post,
    cover,
    siblings,
    canonicalCoverSlug,
  }, event);
};

const adminListPosts = async (event, T) => {
  const all = await scanAll(T.posts);
  const posts = all.map(stripPostBody).sort((a, b) =>
    (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''),
  );
  return ok({ posts, count: posts.length }, event);
};

const hydratePostWithCovers = async (T, post) => {
  if (!post) return post;
  const joins = await listCoversForPost(T, post.slug);
  return { ...post, coverSlugs: joins.map((j) => j.coverSlug) };
};

const adminGetPost = async (event, T) => {
  const slug = str(event.pathParameters?.slug, 100);
  if (!isSlug(slug)) return badRequest('Invalid slug', event);

  const pr = await ddb.send(new GetCommand({ TableName: T.posts, Key: { slug } }));
  if (!pr.Item) return badRequest('Post not found', event);
  const post = await hydratePostWithCovers(T, pr.Item);
  return ok({ post }, event);
};

// Sync the `(post → covers[])` membership. We only ADD the post to
// covers it isn't yet in; the cover ordering is preserved (the new
// post is appended). Remove is done via reorderChapters from the
// cover-edit page, OR if the post is removed from `coverSlugs` here
// we also drop that membership.
const syncPostCovers = async (T, postSlug, nextCoverSlugs) => {
  const valid = nextCoverSlugs.filter((c) => isSlug(c));
  const current = await listCoversForPost(T, postSlug);
  const currentSet = new Set(current.map((j) => j.coverSlug));
  const nextSet = new Set(valid);

  // Remove memberships not in nextSet.
  for (const j of current) {
    if (!nextSet.has(j.coverSlug)) {
      await ddb.send(new DeleteCommand({
        TableName: T.joins,
        Key: { coverSlug: j.coverSlug, sortKey: j.sortKey },
      }));
    }
  }

  // Add new memberships. Append at end → sortOrder = current cover size + 1.
  for (const cs of valid) {
    if (currentSet.has(cs)) continue;
    const existing = await listChapters(T, cs);
    const nextOrder = existing.length + 1;
    await ddb.send(new PutCommand({
      TableName: T.joins,
      Item: {
        coverSlug: cs,
        sortKey: buildSortKey(nextOrder, postSlug),
        postSlug,
        sortOrder: nextOrder,
      },
    }));
  }
};

const adminCreatePost = async (event, T) => {
  const body = parseBody(event);
  const slug = str(body.slug, 100);
  if (!isSlug(slug)) return badRequest('Invalid slug (영문 소문자·숫자·하이픈)', event);
  if (!str(body.title, 300)) return badRequest('제목은 필수입니다.', event);

  const existing = await ddb.send(new GetCommand({ TableName: T.posts, Key: { slug } }));
  if (existing.Item) return conflict('이미 존재하는 포스트 slug 입니다.', event);

  const nowIso = new Date().toISOString();
  const item = buildPostItem(body, { slug, createdAt: nowIso });
  await ddb.send(new PutCommand({ TableName: T.posts, Item: item }));

  const coverSlugs = Array.isArray(body.coverSlugs) ? body.coverSlugs : [];
  await syncPostCovers(T, slug, coverSlugs);

  const post = await hydratePostWithCovers(T, item);
  return ok({ post }, event);
};

const adminUpdatePost = async (event, T) => {
  const slug = str(event.pathParameters?.slug, 100);
  if (!isSlug(slug)) return badRequest('Invalid slug', event);

  const body = parseBody(event);
  if (!str(body.title, 300)) return badRequest('제목은 필수입니다.', event);

  const current = await ddb.send(new GetCommand({ TableName: T.posts, Key: { slug } }));
  if (!current.Item) return badRequest('Post not found', event);

  const item = buildPostItem(body, {
    slug,
    createdAt: current.Item.createdAt || new Date().toISOString(),
  });
  await ddb.send(new PutCommand({ TableName: T.posts, Item: item }));

  if (Array.isArray(body.coverSlugs)) {
    await syncPostCovers(T, slug, body.coverSlugs);
  }

  const post = await hydratePostWithCovers(T, item);
  return ok({ post }, event);
};

const adminDeletePost = async (event, T) => {
  const slug = str(event.pathParameters?.slug, 100);
  if (!isSlug(slug)) return badRequest('Invalid slug', event);

  await deleteAllJoinsOfPost(T, slug);
  await ddb.send(new DeleteCommand({ TableName: T.posts, Key: { slug } }));
  return ok({ slug, deleted: true }, event);
};

// ── Dispatcher ─────────────────────────────────────────────────────────────

const routeKey = (method, resource) => `${method} ${resource}`;

exports.handler = async (event) => {
  try {
    const T = tables(process.env);
    const tableErr = ensureTables(T, event);
    if (tableErr) return tableErr;

    const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
    const resource = event.resource || event.path || '';
    const key = routeKey(method, resource);

    // ── Public routes ──
    switch (key) {
      case 'GET /library/covers':
        return publicListCovers(event, T);
      case 'GET /library/covers/{slug}':
        return publicGetCover(event, T);
      case 'GET /library/posts/{slug}':
        return publicGetPost(event, T);
      default:
        break;
    }

    // ── Admin routes ──
    if (resource.startsWith('/admin/library/')) {
      const { errorResponse } = requireAdmin(event);
      if (errorResponse) return errorResponse;

      switch (key) {
        case 'GET /admin/library/covers':
          return adminListCovers(event, T);
        case 'POST /admin/library/covers':
          return adminCreateCover(event, T);
        case 'GET /admin/library/covers/{slug}':
          return adminGetCover(event, T);
        case 'PUT /admin/library/covers/{slug}':
          return adminUpdateCover(event, T);
        case 'DELETE /admin/library/covers/{slug}':
          return adminDeleteCover(event, T);
        case 'PUT /admin/library/covers/{slug}/chapters':
          return adminReorderChapters(event, T);
        case 'GET /admin/library/posts':
          return adminListPosts(event, T);
        case 'POST /admin/library/posts':
          return adminCreatePost(event, T);
        case 'GET /admin/library/posts/{slug}':
          return adminGetPost(event, T);
        case 'PUT /admin/library/posts/{slug}':
          return adminUpdatePost(event, T);
        case 'DELETE /admin/library/posts/{slug}':
          return adminDeletePost(event, T);
        default:
          break;
      }
    }

    return badRequest(`Unsupported route: ${key}`, event);
  } catch (error) {
    console.error('library handler error', error);
    return serverError('Failed to process library request', event);
  }
};
