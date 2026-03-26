import { API_BASE_URL } from './config.js';
import { createAuthHeaders } from './auth.js';

const toJson = async (res) => {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: text || 'Invalid JSON response' };
  }
};

export const postJson = async (path, body) => {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...createAuthHeaders(),
    },
    body: JSON.stringify(body),
  });

  const payload = await toJson(response);

  if (!response.ok) {
    const errorMessage = payload?.error || `Request failed: ${response.status}`;
    throw new Error(errorMessage);
  }

  if (!payload.success) {
    throw new Error(payload.error || 'API returned success=false');
  }

  return payload.data;
};

export const getJson = async (path) => {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...createAuthHeaders(),
    },
  });

  const payload = await toJson(response);

  if (!response.ok) {
    const errorMessage = payload?.error || `Request failed: ${response.status}`;
    throw new Error(errorMessage);
  }

  if (!payload.success) {
    throw new Error(payload.error || 'API returned success=false');
  }

  return payload.data;
};
