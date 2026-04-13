// Admin-only endpoint for reading and updating the global quota policy.
//
//   GET  /admin/quota-policy  — returns current app-config value + hard caps
//   PUT  /admin/quota-policy  — upsert app-config value (admin only)
//
// The policy document is defined in shared/quota-policy.js (DEFAULT_POLICY).
// All writes are clamped against HARD_CAP_* env vars so an admin cannot
// configure values that would exceed our absolute safety limits.

const { ok, badRequest, serverError } = require('../shared/response');
const { requireAdmin } = require('../shared/auth');
const {
  getAppConfig,
  saveAppConfig,
  HARD_CAP_IMAGE_MB,
  HARD_CAP_STORAGE_GB,
  HARD_CAP_SITE_ZIP_MB,
  DEFAULT_POLICY,
} = require('../shared/quota-policy');

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const buildResponse = (config) => ({
  config,
  defaults: DEFAULT_POLICY,
  hardCaps: {
    imageMB: HARD_CAP_IMAGE_MB,
    storageGB: HARD_CAP_STORAGE_GB,
    siteZipMB: HARD_CAP_SITE_ZIP_MB,
  },
});

exports.handler = async (event) => {
  try {
    const { errorResponse } = requireAdmin(event);
    if (errorResponse) return errorResponse;

    const method = event.httpMethod || event.requestContext?.http?.method;

    if (method === 'GET') {
      const config = await getAppConfig({ bypassCache: true });
      return ok(buildResponse(config), event);
    }

    if (method === 'PUT' || method === 'POST') {
      const body = parseBody(event);
      if (!body || typeof body !== 'object') {
        return badRequest('Request body must be a JSON object', event);
      }

      // Accept either a full policy document under `config` or a flat
      // `{ activePolicy, trainingWindow, perUserTrainingDays, policies }`.
      const incoming = body.config && typeof body.config === 'object' ? body.config : body;
      const saved = await saveAppConfig(incoming);
      return ok(buildResponse(saved), event);
    }

    return badRequest(`Method ${method} not supported`, event);
  } catch (error) {
    console.error('admin-quota-policy error', error);
    return serverError('Failed to handle quota-policy request', event);
  }
};
