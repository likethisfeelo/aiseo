import { COGNITO, COGNITO_REGION } from './config.js';

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

export const buildSignupUrl = () => {
  if (!COGNITO.hostedUiDomain || !COGNITO.clientId) return '';

  const query = toQueryString({
    client_id: COGNITO.clientId,
    response_type: COGNITO.responseType,
    scope: COGNITO.scope,
    redirect_uri: COGNITO.redirectSignIn,
  });

  return `${COGNITO.hostedUiDomain}/signup?${query}`;
};

export const buildLogoutUrl = () => {
  if (!COGNITO.hostedUiDomain || !COGNITO.clientId) return '';

  const query = toQueryString({
    client_id: COGNITO.clientId,
    logout_uri: COGNITO.redirectSignOut,
  });

  return `${COGNITO.hostedUiDomain}/logout?${query}`;
};

export const buildForgotPasswordUrl = () => {
  if (!COGNITO.hostedUiDomain || !COGNITO.clientId) return '';

  const query = toQueryString({
    client_id: COGNITO.clientId,
    response_type: COGNITO.responseType,
    scope: COGNITO.scope,
    redirect_uri: COGNITO.redirectSignIn,
  });

  return `${COGNITO.hostedUiDomain}/forgotPassword?${query}`;
};

const cognitoEndpoint = COGNITO_REGION
  ? `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`
  : '';

const cognitoRequest = async (target, payload) => {
  if (!cognitoEndpoint || !COGNITO.clientId) {
    throw new Error('Cognito 환경변수(VITE_COGNITO_USER_POOL_ID/VITE_COGNITO_CLIENT_ID)를 확인하세요.');
  }

  const response = await fetch(cognitoEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || data.__type) {
    const message = data.message || data.Message || data.__type || 'Cognito 요청 실패';
    throw new Error(message);
  }

  return data;
};

export const signUpWithEmail = async ({ email, password }) => cognitoRequest('SignUp', {
  ClientId: COGNITO.clientId,
  Username: email,
  Password: password,
  UserAttributes: [{ Name: 'email', Value: email }],
});

export const confirmSignUpCode = async ({ email, code }) => cognitoRequest('ConfirmSignUp', {
  ClientId: COGNITO.clientId,
  Username: email,
  ConfirmationCode: code,
});

export const signInWithEmail = async ({ email, password }) => {
  const data = await cognitoRequest('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: COGNITO.clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const auth = data.AuthenticationResult || {};
  tokenStore.setTokens({
    accessToken: auth.AccessToken || '',
    idToken: auth.IdToken || '',
  });

  return auth;
};

export const requestPasswordResetCode = async ({ email }) => cognitoRequest('ForgotPassword', {
  ClientId: COGNITO.clientId,
  Username: email,
});

export const confirmPasswordReset = async ({ email, code, newPassword }) => cognitoRequest('ConfirmForgotPassword', {
  ClientId: COGNITO.clientId,
  Username: email,
  ConfirmationCode: code,
  Password: newPassword,
});

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
