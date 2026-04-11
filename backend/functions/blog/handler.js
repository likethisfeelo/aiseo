const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, serverError, conflict } = require('../shared/response');
const { requireAdmin } = require('../shared/auth');
const { sanitizeBlogHtml } = require('./sanitize');
const { prerenderPost, deletePrerenderedPost } = require('./prerender');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const PAGE_SIZE = 30;
const SLUG_RE = /^[a-z0-9-]+$/;
const MAX_TAGS = 30;

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const boolOf = (v) => v === true || v === 'true';

const numOf = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);

const validateSlug = (slug) => {
  if (!slug || typeof slug !== 'string') return false;
  if (slug.length < 1 || slug.length > 100) return false;
  return SLUG_RE.test(slug);
};

const sanitizeTags = (arr) => {
  if (!Array.isArray(arr)) return [];
  const out = [];
  const seen = new Set();
  for (const t of arr) {
    const tag = str(t, 40);
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
      if (out.length >= MAX_TAGS) break;
    }
  }
  return out;
};

const isPubliclyVisible = (item, nowIso) => {
  if (!item || item.status !== 'published') return false;
  if (item.publishedAt && item.publishedAt > nowIso) return false;
  return true;
};

const scanAll = async (TableName) => {
  const items = [];
  let ExclusiveStartKey;
  // Loop to fully exhaust the scan, though realistically one page will cover it.
  do {
    const result = await ddb.send(new ScanCommand({ TableName, ExclusiveStartKey }));
    if (result.Items) items.push(...result.Items);
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
};

const sortPublishedDesc = (a, b) =>
  (b.publishedAt || '').localeCompare(a.publishedAt || '');

// ── Public handlers ─────────────────────────────────────────────────────────

const publicListPosts = async (event, postsTable) => {
  const qs = event.queryStringParameters || {};
  const category = str(qs.category, 100);
  const tag = str(qs.tag, 40);
  const page = Math.max(1, Math.floor(numOf(qs.page, 1)));

  const nowIso = new Date().toISOString();
  const all = await scanAll(postsTable);
  let visible = all.filter((p) => isPubliclyVisible(p, nowIso));

  if (category) visible = visible.filter((p) => p.category === category);
  if (tag) visible = visible.filter((p) => Array.isArray(p.tags) && p.tags.includes(tag));

  visible.sort(sortPublishedDesc);

  const total = visible.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pagePosts = visible.slice(start, start + PAGE_SIZE).map(stripBodyForCard);

  return ok({ posts: pagePosts, page, pageSize: PAGE_SIZE, total, totalPages });
};

const stripBodyForCard = (p) => {
  // Card payload excludes the (potentially large) markdown body.
  const { body: _body, ...rest } = p;
  return rest;
};

const publicGetPost = async (event, postsTable) => {
  const slug = str(event.pathParameters?.slug, 100);
  if (!validateSlug(slug)) return badRequest('Invalid slug');

  const result = await ddb.send(new GetCommand({ TableName: postsTable, Key: { slug } }));
  const post = result.Item;
  const nowIso = new Date().toISOString();
  if (!isPubliclyVisible(post, nowIso)) return badRequest('Post not found');

  // Atomic view count increment. Fire and await; fast enough.
  try {
    const update = await ddb.send(new UpdateCommand({
      TableName: postsTable,
      Key: { slug },
      UpdateExpression: 'ADD viewCount :inc SET updatedAt = if_not_exists(updatedAt, :now)',
      ExpressionAttributeValues: { ':inc': 1, ':now': post.updatedAt || nowIso },
      ReturnValues: 'UPDATED_NEW',
    }));
    if (update.Attributes && typeof update.Attributes.viewCount === 'number') {
      post.viewCount = update.Attributes.viewCount;
    }
  } catch (err) {
    console.error('viewCount update failed', err);
  }

  return ok({ post });
};

const publicFeatured = async (_event, postsTable) => {
  const nowIso = new Date().toISOString();
  const all = await scanAll(postsTable);
  const featured = all
    .filter((p) => isPubliclyVisible(p, nowIso) && p.featured === true)
    .sort((a, b) => {
      const ao = Number.isFinite(a.featuredOrder) ? a.featuredOrder : 9999;
      const bo = Number.isFinite(b.featuredOrder) ? b.featuredOrder : 9999;
      if (ao !== bo) return ao - bo;
      return sortPublishedDesc(a, b);
    })
    .slice(0, 4)
    .map(stripBodyForCard);

  return ok({ posts: featured });
};

const publicPopular = async (_event, postsTable) => {
  const nowIso = new Date().toISOString();
  const all = await scanAll(postsTable);
  const popular = all
    .filter((p) => isPubliclyVisible(p, nowIso))
    .sort((a, b) => {
      const av = Number.isFinite(a.viewCount) ? a.viewCount : 0;
      const bv = Number.isFinite(b.viewCount) ? b.viewCount : 0;
      if (bv !== av) return bv - av;
      return sortPublishedDesc(a, b);
    })
    .slice(0, 3)
    .map(stripBodyForCard);

  return ok({ posts: popular });
};

const publicCategories = async (_event, categoriesTable) => {
  const all = await scanAll(categoriesTable);
  const categories = all.sort((a, b) => {
    const ao = Number.isFinite(a.order) ? a.order : 9999;
    const bo = Number.isFinite(b.order) ? b.order : 9999;
    if (ao !== bo) return ao - bo;
    return (a.name || '').localeCompare(b.name || '');
  });
  return ok({ categories });
};

// ── Admin handlers: posts ───────────────────────────────────────────────────

const adminListPosts = async (_event, postsTable) => {
  const all = await scanAll(postsTable);
  // Admin sees everything — sort newest updated first for the management list.
  const posts = all
    .map(stripBodyForCard)
    .sort((a, b) =>
      (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')
    );
  return ok({ posts, count: posts.length });
};

const adminGetPost = async (event, postsTable) => {
  const slug = str(event.pathParameters?.slug, 100);
  if (!validateSlug(slug)) return badRequest('Invalid slug');

  const result = await ddb.send(new GetCommand({ TableName: postsTable, Key: { slug } }));
  if (!result.Item) return badRequest('Post not found');
  return ok({ post: result.Item });
};

const buildPostItem = (body, base = {}) => {
  const nowIso = new Date().toISOString();
  const title = str(body.title, 300);
  const excerpt = str(body.excerpt, 500);
  // `body.body` arrives from the TipTap editor as HTML. We sanitize
  // against a narrow allow-list (see sanitize.js) and then cap at
  // 300KB. The cap is applied after sanitization so the stored value
  // is never half-truncated tags.
  const rawHtml = typeof body.body === 'string' ? body.body : '';
  const html = sanitizeBlogHtml(rawHtml).slice(0, 300000);
  const category = str(body.category, 100);
  const tags = sanitizeTags(body.tags);
  const thumbnailUrl = str(body.thumbnailUrl, 1000);
  const ogImageUrl = str(body.ogImageUrl, 1000);
  const metaTitle = str(body.metaTitle, 300);
  const metaDescription = str(body.metaDescription, 500);
  const rawStatus = str(body.status, 20);
  const status = ['draft', 'published', 'deleted'].includes(rawStatus) ? rawStatus : 'draft';
  const publishedAt = str(body.publishedAt, 40) || (status === 'published' ? nowIso : '');
  const featured = boolOf(body.featured);
  const featuredOrder = Number.isFinite(body.featuredOrder) ? Math.floor(body.featuredOrder) : 9999;

  return {
    ...base,
    title,
    excerpt,
    body: html,
    category,
    tags,
    thumbnailUrl,
    ogImageUrl,
    metaTitle,
    metaDescription,
    status,
    publishedAt,
    featured,
    featuredOrder,
    updatedAt: nowIso,
    author: 'AISEO',
  };
};

const adminCreatePost = async (event, postsTable) => {
  const body = parseBody(event);
  const slug = str(body.slug, 100);
  if (!validateSlug(slug)) return badRequest('Invalid slug (영문 소문자·숫자·하이픈)');
  if (!str(body.title, 300)) return badRequest('제목은 필수입니다.');

  const existing = await ddb.send(new GetCommand({ TableName: postsTable, Key: { slug } }));
  if (existing.Item) return conflict('이미 존재하는 slug 입니다.');

  const nowIso = new Date().toISOString();
  const item = buildPostItem(body, {
    slug,
    createdAt: nowIso,
    viewCount: 0,
  });

  await ddb.send(new PutCommand({ TableName: postsTable, Item: item }));

  // Fire-and-await prerender so the OG/meta HTML snapshot
  // exists before we respond. Any failure is logged inside
  // prerenderPost and does not fail the API call.
  await prerenderPost(item);

  return ok({ post: item });
};

const adminUpdatePost = async (event, postsTable) => {
  const oldSlug = str(event.pathParameters?.slug, 100);
  if (!validateSlug(oldSlug)) return badRequest('Invalid slug');

  const body = parseBody(event);
  const newSlug = str(body.slug, 100) || oldSlug;
  if (!validateSlug(newSlug)) return badRequest('Invalid new slug');
  if (!str(body.title, 300)) return badRequest('제목은 필수입니다.');

  const current = await ddb.send(new GetCommand({ TableName: postsTable, Key: { slug: oldSlug } }));
  if (!current.Item) return badRequest('Post not found');

  const base = {
    slug: newSlug,
    createdAt: current.Item.createdAt || new Date().toISOString(),
    viewCount: Number.isFinite(current.Item.viewCount) ? current.Item.viewCount : 0,
  };
  const item = buildPostItem(body, base);

  if (newSlug !== oldSlug) {
    // Make sure the new slug isn't already taken by a different post.
    const collision = await ddb.send(new GetCommand({ TableName: postsTable, Key: { slug: newSlug } }));
    if (collision.Item) return conflict('이미 존재하는 slug 입니다.');

    await ddb.send(new PutCommand({ TableName: postsTable, Item: item }));
    await ddb.send(new DeleteCommand({ TableName: postsTable, Key: { slug: oldSlug } }));
    // Slug rename — drop the OLD prerendered file so stale
    // links stop resolving, then regenerate under the new slug.
    await deletePrerenderedPost(oldSlug);
  } else {
    await ddb.send(new PutCommand({ TableName: postsTable, Item: item }));
  }

  // Always refresh the prerender on update. When status !=
  // published, prerenderPost delegates to deletePrerenderedPost
  // so unpublishing cleans up automatically.
  await prerenderPost(item);

  return ok({ post: item });
};

const adminDeletePost = async (event, postsTable) => {
  const slug = str(event.pathParameters?.slug, 100);
  if (!validateSlug(slug)) return badRequest('Invalid slug');

  const nowIso = new Date().toISOString();
  await ddb.send(new UpdateCommand({
    TableName: postsTable,
    Key: { slug },
    UpdateExpression: 'SET #s = :deleted, updatedAt = :now',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':deleted': 'deleted', ':now': nowIso },
  }));

  // Soft delete — still need to drop the prerendered HTML so
  // the post stops surfacing in social previews.
  await deletePrerenderedPost(slug);

  return ok({ slug, status: 'deleted' });
};

// ── Admin handlers: categories ──────────────────────────────────────────────

const adminListCategories = async (_event, categoriesTable) => {
  const all = await scanAll(categoriesTable);
  const categories = all.sort((a, b) => {
    const ao = Number.isFinite(a.order) ? a.order : 9999;
    const bo = Number.isFinite(b.order) ? b.order : 9999;
    if (ao !== bo) return ao - bo;
    return (a.name || '').localeCompare(b.name || '');
  });
  return ok({ categories, count: categories.length });
};

const adminCreateCategory = async (event, categoriesTable) => {
  const body = parseBody(event);
  const slug = str(body.slug, 100);
  const name = str(body.name, 200);
  const order = Number.isFinite(body.order) ? Math.floor(body.order) : 9999;

  if (!validateSlug(slug)) return badRequest('Invalid slug');
  if (!name) return badRequest('이름은 필수입니다.');

  const existing = await ddb.send(new GetCommand({ TableName: categoriesTable, Key: { slug } }));
  if (existing.Item) return conflict('이미 존재하는 카테고리 slug 입니다.');

  const nowIso = new Date().toISOString();
  const item = { slug, name, order, createdAt: nowIso };
  await ddb.send(new PutCommand({ TableName: categoriesTable, Item: item }));
  return ok({ category: item });
};

const adminUpdateCategory = async (event, categoriesTable) => {
  const slug = str(event.pathParameters?.slug, 100);
  if (!validateSlug(slug)) return badRequest('Invalid slug');

  const body = parseBody(event);
  const name = str(body.name, 200);
  const order = Number.isFinite(body.order) ? Math.floor(body.order) : 9999;

  if (!name) return badRequest('이름은 필수입니다.');

  const current = await ddb.send(new GetCommand({ TableName: categoriesTable, Key: { slug } }));
  if (!current.Item) return badRequest('Category not found');

  const item = { ...current.Item, slug, name, order };
  await ddb.send(new PutCommand({ TableName: categoriesTable, Item: item }));
  return ok({ category: item });
};

const adminDeleteCategory = async (event, categoriesTable) => {
  const slug = str(event.pathParameters?.slug, 100);
  if (!validateSlug(slug)) return badRequest('Invalid slug');

  await ddb.send(new DeleteCommand({ TableName: categoriesTable, Key: { slug } }));
  return ok({ slug, deleted: true });
};

// ── Dispatcher ──────────────────────────────────────────────────────────────

const routeKey = (method, resource) => `${method} ${resource}`;

exports.handler = async (event) => {
  try {
    const postsTable = process.env.BLOG_POSTS_TABLE;
    const categoriesTable = process.env.BLOG_CATEGORIES_TABLE;
    if (!postsTable || !categoriesTable) {
      return serverError('Blog tables not configured');
    }

    const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
    // event.resource uses the parameterized template (e.g. "/blog/posts/{slug}")
    const resource = event.resource || event.path || '';
    const key = routeKey(method, resource);

    // Public routes (no auth).
    switch (key) {
      case 'GET /blog/posts':
        return publicListPosts(event, postsTable);
      case 'GET /blog/posts/{slug}':
        return publicGetPost(event, postsTable);
      case 'GET /blog/featured':
        return publicFeatured(event, postsTable);
      case 'GET /blog/popular':
        return publicPopular(event, postsTable);
      case 'GET /blog/categories':
        return publicCategories(event, categoriesTable);
      default:
        break;
    }

    // Admin routes — require admin claim.
    if (resource.startsWith('/admin/blog/')) {
      const { errorResponse } = requireAdmin(event);
      if (errorResponse) return errorResponse;

      switch (key) {
        case 'GET /admin/blog/posts':
          return adminListPosts(event, postsTable);
        case 'POST /admin/blog/posts':
          return adminCreatePost(event, postsTable);
        case 'GET /admin/blog/posts/{slug}':
          return adminGetPost(event, postsTable);
        case 'PUT /admin/blog/posts/{slug}':
          return adminUpdatePost(event, postsTable);
        case 'DELETE /admin/blog/posts/{slug}':
          return adminDeletePost(event, postsTable);
        case 'GET /admin/blog/categories':
          return adminListCategories(event, categoriesTable);
        case 'POST /admin/blog/categories':
          return adminCreateCategory(event, categoriesTable);
        case 'PUT /admin/blog/categories/{slug}':
          return adminUpdateCategory(event, categoriesTable);
        case 'DELETE /admin/blog/categories/{slug}':
          return adminDeleteCategory(event, categoriesTable);
        default:
          break;
      }
    }

    return badRequest(`Unsupported route: ${key}`);
  } catch (error) {
    console.error('blog handler error', error);
    return serverError('Failed to process blog request');
  }
};
