const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(payload),
});

const ok = (data) => json(200, { success: true, data });

const badRequest = (error) => json(400, { success: false, error });

const unauthorized = (error) => json(401, { success: false, error });

const forbidden = (error) => json(403, { success: false, error });

const conflict = (error) => json(409, { success: false, error });

const serverError = (error) => json(500, { success: false, error });

module.exports = {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  conflict,
  serverError,
};
