const { ok } = require('../shared/response');
const { requireUser } = require('../shared/auth');

exports.handler = async (event) => {
  const { user, errorResponse } = requireUser(event);
  if (errorResponse) return errorResponse;
  const claims = user.claims;

  return ok({
    user: {
      sub: claims.sub || '',
      email: claims.email || '',
      emailVerified: claims.email_verified === 'true' || claims.email_verified === true,
      name: claims.name || claims['cognito:username'] || '',
      username: claims['cognito:username'] || '',
    },
  });
};
