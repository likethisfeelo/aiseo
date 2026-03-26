import { COGNITO } from './config.js';

const ACCESS_TOKEN_KEY = 'aiseo.accessToken';
const ID_TOKEN_KEY = 'aiseo.idToken';

const toQueryString = (params) =>
  Object.entries(params)
    .filter(([, value]) => Boolean(value))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

export const tokenStore = {
  getAccessToken() {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(ACCESS_TOKEN_KEY) || '';
  },

  getIdToken() {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(ID_TOKEN_KEY) || '';
  },

  setTokens({ accessToken, idToken }) {
    if (typeof window === 'undefined') return;

    if (accessToken) window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (idToken) window.localStorage.setItem(ID_TOKEN_KEY, idToken);
  },

  clear() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(ID_TOKEN_KEY);
  },
};

export const createAuthHeaders = () => {
  const token = tokenStore.getAccessToken();
  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const buildLoginUrl = () => {
  if (!COGNITO.hostedUiDomain || !COGNITO.clientId) return '';

  const query = toQueryString({
    client_id: COGNITO.clientId,
    response_type: COGNITO.responseType,
    scope: COGNITO.scope,
    redirect_uri: COGNITO.redirectSignIn,
  });

  return `${COGNITO.hostedUiDomain}/login?${query}`;
};

export const buildLogoutUrl = () => {
  if (!COGNITO.hostedUiDomain || !COGNITO.clientId) return '';

  const query = toQueryString({
    client_id: COGNITO.clientId,
    logout_uri: COGNITO.redirectSignOut,
  });

  return `${COGNITO.hostedUiDomain}/logout?${query}`;
};

const parseHashParams = (hashValue) => {
  const hash = String(hashValue || '').replace(/^#/, '');
  if (!hash) return {};

  return hash.split('&').reduce((acc, pair) => {
    const [rawKey, rawValue] = pair.split('=');
    if (!rawKey) return acc;
    acc[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue || '');
    return acc;
  }, {});
};

export const consumeCognitoCallbackTokens = () => {
  if (typeof window === 'undefined') return false;

  const params = parseHashParams(window.location.hash);
  const accessToken = params.access_token || '';
  const idToken = params.id_token || '';

  if (!accessToken && !idToken) return false;

  tokenStore.setTokens({ accessToken, idToken });

  const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  window.history.replaceState({}, document.title, cleanUrl);

  return true;
};
