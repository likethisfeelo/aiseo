import { getJson, postJson } from './api-client.js';

export const createUploadUrl = (input) => postJson('/upload-url', input);

export const validateSite = (input) => postJson('/validate', input);

export const deploySite = (input) => postJson('/deploy', input);

export const getMe = () => getJson('/me');

export const selectSite = (input) => postJson('/site/select', input);

export const getSiteSettings = (siteId) => getJson(`/site/settings?siteId=${encodeURIComponent(siteId)}`);

export const saveSiteSettings = (input) => postJson('/site/settings', input);
