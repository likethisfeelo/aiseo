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

// Normalize the `cognito:groups` claim to an array of group names.
// API Gateway REST API delivers this claim in three different shapes
// depending on the user's group count and the authorizer flavor:
//   - HTTP API v2 / single group via Lambda authorizer → JS array
//   - REST API + single group                          → "admin"
//   - REST API + multiple groups                       → "[admin paid_member]"
//                                                        (brackets + space-separated)
// Without this normalizer an admin who is ALSO a paid_member fails
// the `=== 'admin'` check and gets a spurious 403.
const parseGroupsClaim = (raw) => {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw !== 'string' || !raw) return [];
  const trimmed = raw.trim().replace(/^\[|\]$/g, '');
  return trimmed.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
};

const getGroups = (event) => {
  const claims = getClaims(event);
  if (!claims) return [];
  return parseGroupsClaim(claims['cognito:groups']);
};

const isAdmin = (event) => getGroups(event).includes('admin');

const requireAdmin = (event) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return { user: null, errorResponse };
  if (!isAdmin(event)) return { user: null, errorResponse: forbidden('Admin access required', event) };
  return { user, errorResponse: null };
};

module.exports = {
  getClaims,
  getUserContext,
  parseGroupsClaim,
  getGroups,
  requireUser,
  isAdmin,
  requireAdmin,
};
