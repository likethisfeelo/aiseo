const readEnv = (key, fallback = '') => {
  if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
    return import.meta.env[key];
  }

  return fallback;
};

export const APP_ENV = readEnv('VITE_APP_ENV', 'dev');

const DEV_API_BASE_URL = readEnv('VITE_API_BASE_URL_DEV', 'https://api-dev.aiseo.tips');
const PROD_API_BASE_URL = readEnv('VITE_API_BASE_URL_PROD', 'https://api.aiseo.tips');

export const API_BASE_URL = APP_ENV === 'prod' ? PROD_API_BASE_URL : DEV_API_BASE_URL;

const defaultRedirectUri =
  APP_ENV === 'prod' ? 'https://site.aiseo.tips' : 'https://site.dev.aiseo.tips';

export const COGNITO = {
  userPoolId: readEnv('VITE_COGNITO_USER_POOL_ID'),
  clientId: readEnv('VITE_COGNITO_CLIENT_ID'),
  hostedUiDomain: readEnv('VITE_COGNITO_HOSTED_UI_DOMAIN'),
  redirectSignIn: readEnv('VITE_COGNITO_REDIRECT_SIGN_IN', defaultRedirectUri),
  redirectSignOut: readEnv('VITE_COGNITO_REDIRECT_SIGN_OUT', defaultRedirectUri),
  responseType: readEnv('VITE_COGNITO_RESPONSE_TYPE', 'token'),
  scope: readEnv('VITE_COGNITO_SCOPE', 'openid email profile'),
};

export const COGNITO_REGION = String(COGNITO.userPoolId || '').split('_')[0] || '';
