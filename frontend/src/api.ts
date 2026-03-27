import { getJson, postJson } from './api-client.js';
import type { Brand, HeadSnippets, Product, Service, Store } from './types';

// ── Existing MVP APIs ──
export const createUploadUrl = (input: { siteId: string; fileName: string; fileSize: number }) =>
  postJson('/upload-url', input);

export const validateSite = (input: { siteId: string; objectKey: string }) =>
  postJson('/validate', input);

export const deploySite = (input: { siteId: string; objectKey: string; env: string }) =>
  postJson('/deploy', input);

export const getMe = () => getJson('/me');

export const selectSite = (input: { siteId: string }) =>
  postJson('/site/select', input);

export const getSiteSettings = (siteId: string) =>
  getJson(`/site/settings?siteId=${encodeURIComponent(siteId)}`);

export const saveSiteSettings = (input: { siteId: string; headSnippets: HeadSnippets }) =>
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

// ── Image Upload API ──
export const createImageUploadUrl = (input: { siteId: string; fileName: string; fileType: string }) =>
  postJson('/image-upload', input);

// ── Comments APIs (User) ──
export const getComments = (siteId: string, targetType?: string, targetId?: string) => {
  const params = new URLSearchParams({ siteId });
  if (targetType) params.set('targetType', targetType);
  if (targetId) params.set('targetId', targetId);
  return getJson(`/comments?${params.toString()}`);
};

export const markCommentsRead = (input: { siteId: string; commentIds: string[] }) =>
  postJson('/comments/read', input);

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
