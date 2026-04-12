const { unauthorized, forbidden } = require('./response');

const getClaims = (event) => {
  const claims = event?.requestContext?.authorizer?.claims;
  if (claims && typeof claims === 'object') return claims;

  const jwtClaims = event?.requestContext?.authorizer?.jwt?.claims;
  if (jwtClaims && typeof jwtClaims === 'object') return jwtClaims;

  return null;
};

const getUserContext = (event) => {
  const claims = getClaims(event);
  if (!claims) return null;

  const sub = claims.sub || claims.username || '';
  if (!sub) return null;

  return {
    sub,
    email: claims.email || '',
    username: claims['cognito:username'] || claims.username || '',
    claims,
  };
};

const requireUser = (event) => {
  const user = getUserContext(event);
  if (!user) return { user: null, errorResponse: unauthorized('Unauthorized', event) };
  return { user, errorResponse: null };
};

const isAdmin = (event) => {
  const claims = getClaims(event);
  if (!claims) return false;
  const groups = claims['cognito:groups'] || [];
  if (Array.isArray(groups)) return groups.includes('admin');
  return groups === 'admin';
};

const requireAdmin = (event) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return { user: null, errorResponse };
  if (!isAdmin(event)) return { user: null, errorResponse: forbidden('Admin access required', event) };
  return { user, errorResponse: null };
};

module.exports = {
  getClaims,
  getUserContext,
  requireUser,
  isAdmin,
  requireAdmin,
};
