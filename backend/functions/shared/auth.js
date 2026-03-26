const { unauthorized } = require('./response');

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
  if (!user) return { user: null, errorResponse: unauthorized('Unauthorized') };
  return { user, errorResponse: null };
};

module.exports = {
  getClaims,
  getUserContext,
  requireUser,
};
