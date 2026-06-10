import { getJson, postJson, putJson, deleteJson } from './api-client.js';
import type { Brand, HeadSnippets, Product, Service, Store } from './types';

// ── Existing MVP APIs ──
export const createUploadUrl = (input: { siteId: string; fileName: string; fileSize: number }) =>
  postJson('/upload-url', input);

export const validateSite = (input: { siteId: string; objectKey: string }) =>
  postJson('/validate', input);

export const deploySite = (input: { siteId: string; objectKey: string; env: string }) =>
  postJson('/deploy', input);

export const getMe = () => getJson('/me') as Promise<{
  user: {
    sub: string;
    email: string;
    emailVerified: boolean;
    name: string;
    username: string;
    groups: string[];
  };
  siteId: string | null;
}>;

export interface AdminUserRow {
  sub: string;
  username: string;
  email: string;
  name: string;
  emailVerified: boolean;
  enabled: boolean;
  status: string;
  createdAt: string;
  groups: string[];
  isPaid: boolean;
  isAdmin: boolean;
}

export const adminListUsers = (params: { search?: string; paginationToken?: string } = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.paginationToken) query.set('paginationToken', params.paginationToken);
  const qs = query.toString();
  return getJson(`/admin/users${qs ? `?${qs}` : ''}`) as Promise<{
    users: AdminUserRow[];
    nextToken: string | null;
    count: number;
  }>;
};

export const adminGrantPaidMember = (username: string) =>
  postJson('/admin/users/grant', { username });

export const adminRevokePaidMember = (username: string) =>
  postJson('/admin/users/revoke', { username });

export const selectSite = (input: { siteId: string }) =>
  postJson('/site/select', input);

export const getSiteSettings = (siteId: string) =>
  getJson(`/site/settings?siteId=${encodeURIComponent(siteId)}`);

export const saveSiteSettings = (input: { siteId: string; headSnippets?: HeadSnippets; seoKeywords?: string[] }) =>
  postJson('/site/settings', input);

// ── Brand APIs ──
export const getBrand = (siteId: string) =>
  getJson(`/brand?siteId=${encodeURIComponent(siteId)}`);

export const saveBrand = (input: { siteId: string; brand: Partial<Brand> }) =>
  postJson('/brand', input);

// ── Product APIs ──
export const getProducts = (siteId: string) =>
  getJson(`/products?siteId=${encodeURIComponent(siteId)}`);

export const saveProduct = (input: { siteId: string; product: Partial<Product> }) =>
  postJson('/products', input);

export const deleteProduct = (input: { siteId: string; productId: string }) =>
  postJson('/products/delete', input);

// ── Service APIs ──
export const getServices = (siteId: string) =>
  getJson(`/services?siteId=${encodeURIComponent(siteId)}`);

export const saveService = (input: { siteId: string; service: Partial<Service> }) =>
  postJson('/services', input);

export const deleteService = (input: { siteId: string; serviceId: string }) =>
  postJson('/services/delete', input);

// ── Store APIs ──
export const getStore = (siteId: string) =>
  getJson(`/store?siteId=${encodeURIComponent(siteId)}`);

export const saveStore = (input: { siteId: string; store: Partial<Store> }) =>
  postJson('/store', input);

// ── SEO Snapshot APIs ──
export const getSeoSnapshots = (siteId: string) =>
  getJson(`/seo-snapshots?siteId=${encodeURIComponent(siteId)}`);

export const saveSeoSnapshot = (input: { siteId: string; snapshot: Record<string, unknown> }) =>
  postJson('/seo-snapshots', input);

export const deleteSeoSnapshot = (input: { siteId: string; snapshotId: string }) =>
  postJson('/seo-snapshots/delete', input);

export const triggerSeoAutoCheck = (input: { siteId: string }) =>
  postJson('/seo-snapshots/auto-check', input);

// ── Image Upload API ──
export const createImageUploadUrl = (input: {
  siteId: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
}) => postJson('/image-upload', input);

// ── Quota Status / Admin Policy ──
export const getQuotaStatus = () => getJson('/quota/status');

export const adminGetQuotaPolicy = () => getJson('/admin/quota-policy');

export const adminSaveQuotaPolicy = (config: Record<string, unknown>) =>
  putJson('/admin/quota-policy', { config });

// ── Comments APIs (User) ──
export const getComments = (siteId: string, targetType?: string, targetId?: string) => {
  const params = new URLSearchParams({ siteId });
  if (targetType) params.set('targetType', targetType);
  if (targetId) params.set('targetId', targetId);
  return getJson(`/comments?${params.toString()}`);
};

export const markCommentsRead = (input: { siteId: string; commentIds: string[] }) =>
  postJson('/comments/read', input);

// ── Consultation APIs ──
export const submitConsultation = async (input: {
  name: string;
  phone: string;
  contentConfirmed: boolean;
  selectedServices: string[];
  businessRegistered: string;
  specialIndustry: string;
  kakaoConsent: boolean;
}) => {
  const { API_BASE_URL } = await import('./config.js');
  const res = await fetch(`${API_BASE_URL}/consultation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await res.json();
  if (!res.ok || !payload.success) throw new Error(payload.error || 'Submission failed');
  return payload.data;
};

export const adminGetConsultations = () => getJson('/admin/consultations');

// ── B2B Consultation APIs ──
export const submitB2BConsultation = async (input: {
  company: string;
  contactName: string;
  phone: string;
  industry: string;
  marketingStatus: string;
  memo: string;
  consent: boolean;
}) => {
  const { API_BASE_URL } = await import('./config.js');
  const res = await fetch(`${API_BASE_URL}/b2b-consultation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await res.json();
  if (!res.ok || !payload.success) throw new Error(payload.error || 'Submission failed');
  return payload.data;
};

export const adminGetB2BConsultations = () => getJson('/admin/b2b-consultations');

// ── Course inquiry APIs ──
export const submitCourseInquiry = async (input: {
  name: string;
  phone: string;
  email?: string;
  memo?: string;
  kakaoConsent: boolean;
  selectedServices: string[];
  servicesSnapshot?: Array<{ id: string; code: string; name: string; price: number; priceLabel: string }>;
  totalPrice?: number;
  source?: string;
  route?: {
    id: string;
    title: string;
    totalEst: string;
    estimate: Array<{ label: string; value: string }>;
  };
}) => {
  const { API_BASE_URL } = await import('./config.js');
  const res = await fetch(`${API_BASE_URL}/course-inquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await res.json();
  if (!res.ok || !payload.success) throw new Error(payload.error || 'Submission failed');
  return payload.data;
};

export const adminGetCourseInquiries = () => getJson('/admin/course-inquiries');

// ── Event signup APIs (events 2026: free / paid) ──
export type EventCode = 'EVENT_01_FREE' | 'EVENT_02_PAID' | 'EVENT_03_PAID' | 'EVENT_04_PAID';
export type EventHasSite = 'yes' | 'no' | 'wip';

export interface EventSignupPayload {
  eventCode: EventCode;
  name: string;
  phone: string;
  email?: string;
  industry?: string;
  region?: string;
  hasSite?: EventHasSite;
  concern?: string;
  kakaoConsent: boolean;
  source?: string;
}

export const submitEventSignup = async (input: EventSignupPayload) => {
  const { API_BASE_URL } = await import('./config.js');
  const res = await fetch(`${API_BASE_URL}/event-signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await res.json();
  if (!res.ok || !payload.success) throw new Error(payload.error || 'Submission failed');
  return payload.data as { signupId: string };
};

export const adminGetEventSignups = () => getJson('/admin/event-signups');

// ── Newsletter APIs ──
export type NewsletterPersona =
  | 'small-business'
  | 'freelancer'
  | 'startup'
  | 'marketer'
  | 'creator';

export const subscribeNewsletter = async (input: {
  email: string;
  persona?: NewsletterPersona;
  source?: string;
}) => {
  const { API_BASE_URL } = await import('./config.js');
  const res = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await res.json();
  if (!res.ok || !payload.success) throw new Error(payload.error || 'Subscription failed');
  return payload.data as { email: string; persona: string; alreadySubscribed?: boolean };
};

export const adminGetNewsletterSubscribers = () => getJson('/admin/newsletter-subscribers');

// ── Admin APIs ──
export const adminGetSites = () => getJson('/admin/sites');

export const adminGetSite = (siteId: string) =>
  getJson(`/admin/site?siteId=${encodeURIComponent(siteId)}`);

export const adminCreateComment = (input: {
  siteId: string;
  targetType: string;
  targetId?: string;
  targetField?: string;
  type: 'opinion' | 'suggestion' | 'correction';
  content: string;
  suggestedValue?: string;
}) => postJson('/admin/comment', input);

// ── Blog APIs (public) ──
export const getBlogPosts = (params: { category?: string; tag?: string; page?: number } = {}) => {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.tag) qs.set('tag', params.tag);
  if (params.page) qs.set('page', String(params.page));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return getJson(`/blog/posts${suffix}`);
};

export const getBlogPost = (slug: string) =>
  getJson(`/blog/posts/${encodeURIComponent(slug)}`);

export const getBlogFeatured = () => getJson('/blog/featured');

export const getBlogPopular = () => getJson('/blog/popular');

export const getBlogCategories = () => getJson('/blog/categories');

// ── Blog APIs (admin) ──
export const adminListBlogPosts = () => getJson('/admin/blog/posts');

export const adminGetBlogPost = (slug: string) =>
  getJson(`/admin/blog/posts/${encodeURIComponent(slug)}`);

export const adminCreateBlogPost = (post: Record<string, unknown>) =>
  postJson('/admin/blog/posts', post);

export const adminUpdateBlogPost = (slug: string, post: Record<string, unknown>) =>
  putJson(`/admin/blog/posts/${encodeURIComponent(slug)}`, post);

export const adminDeleteBlogPost = (slug: string) =>
  deleteJson(`/admin/blog/posts/${encodeURIComponent(slug)}`);

export const adminListBlogCategories = () => getJson('/admin/blog/categories');

export const adminCreateBlogCategory = (cat: { slug: string; name: string; order?: number }) =>
  postJson('/admin/blog/categories', cat);

export const adminUpdateBlogCategory = (slug: string, cat: { name: string; order?: number }) =>
  putJson(`/admin/blog/categories/${encodeURIComponent(slug)}`, cat);

export const adminDeleteBlogCategory = (slug: string) =>
  deleteJson(`/admin/blog/categories/${encodeURIComponent(slug)}`);

// ── AI SEO Library APIs (public) ──
// 모든 응답은 backend/functions/library/handler.js 의 ok() helper 가
// `{success:true, data}` 래핑하므로 client 는 `data` 만 받음.
export const getLibraryCovers = () => getJson('/library/covers');

export const getLibraryCover = (slug: string) =>
  getJson(`/library/covers/${encodeURIComponent(slug)}`);

export const getLibraryPost = (slug: string, coverSlug?: string) => {
  const qs = coverSlug ? `?cover=${encodeURIComponent(coverSlug)}` : '';
  return getJson(`/library/posts/${encodeURIComponent(slug)}${qs}`);
};

// ── AI SEO Library APIs (admin) ──
export const adminListLibraryCovers = () => getJson('/admin/library/covers');

export const adminGetLibraryCover = (slug: string) =>
  getJson(`/admin/library/covers/${encodeURIComponent(slug)}`);

export const adminCreateLibraryCover = (cover: Record<string, unknown>) =>
  postJson('/admin/library/covers', cover);

export const adminUpdateLibraryCover = (slug: string, cover: Record<string, unknown>) =>
  putJson(`/admin/library/covers/${encodeURIComponent(slug)}`, cover);

export const adminDeleteLibraryCover = (slug: string) =>
  deleteJson(`/admin/library/covers/${encodeURIComponent(slug)}`);

export const adminReorderLibraryCoverChapters = (
  coverSlug: string,
  chapters: string[],
) => putJson(`/admin/library/covers/${encodeURIComponent(coverSlug)}/chapters`, { chapters });

export const adminListLibraryPosts = () => getJson('/admin/library/posts');

export const adminGetLibraryPost = (slug: string) =>
  getJson(`/admin/library/posts/${encodeURIComponent(slug)}`);

export const adminCreateLibraryPost = (post: Record<string, unknown>) =>
  postJson('/admin/library/posts', post);

export const adminUpdateLibraryPost = (slug: string, post: Record<string, unknown>) =>
  putJson(`/admin/library/posts/${encodeURIComponent(slug)}`, post);

export const adminDeleteLibraryPost = (slug: string) =>
  deleteJson(`/admin/library/posts/${encodeURIComponent(slug)}`);

export const adminListLibraryAudit = (limit = 100) =>
  getJson(`/admin/library/audit?limit=${limit}`);
