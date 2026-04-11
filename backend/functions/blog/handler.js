// Phase 1 stub — real routing logic is implemented in Phase 2.
// Kept minimal so the CDK Lambda asset builds and the API can be wired up.

const { ok, serverError } = require('../shared/response');

exports.handler = async (event) => {
  try {
    const method = event.httpMethod || 'GET';
    const path = event.path || event.resource || '';
    return ok({
      message: 'blog handler stub — not implemented yet',
      method,
      path,
    });
  } catch (err) {
    return serverError(err && err.message ? err.message : 'blog handler error');
  }
};
