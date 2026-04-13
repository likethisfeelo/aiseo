const ALLOWED_ORIGINS = new Set([
  'https://aiseo.tips',
  'https://dev.aiseo.tips',
  'https://site.aiseo.tips',
  'https://site.dev.aiseo.tips',
  'https://b2b.aiseo.tips',
  'https://b2b.dev.aiseo.tips',
  'http://localhost:5173',
]);

const DEFAULT_ORIGIN = 'https://aiseo.tips';

const pickOrigin = (event) => {
  const headers = event && event.headers ? event.headers : {};
  const origin = headers.origin || headers.Origin || '';
  return ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN;
};

const json = (statusCode, payload, event) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': pickOrigin(event),
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  },
  body: JSON.stringify(payload),
});

const ok = (data, event) => json(200, { success: true, data }, event);

const badRequest = (error, event) => json(400, { success: false, error }, event);

const unauthorized = (error, event) => json(401, { success: false, error }, event);

const forbidden = (error, event) => json(403, { success: false, error }, event);

const conflict = (error, event) => json(409, { success: false, error }, event);

const payloadTooLarge = (error, event, details) =>
  json(413, { success: false, error, ...(details ? { details } : {}) }, event);

const tooManyRequests = (error, event, details) =>
  json(429, { success: false, error, ...(details ? { details } : {}) }, event);

const serverError = (error, event) => json(500, { success: false, error }, event);

module.exports = {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  conflict,
  payloadTooLarge,
  tooManyRequests,
  serverError,
};
