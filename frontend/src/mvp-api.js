import { postJson } from './api-client.js';

export const createUploadUrl = (input) => postJson('/upload-url', input);

export const validateSite = (input) => postJson('/validate', input);

export const deploySite = (input) => postJson('/deploy', input);
