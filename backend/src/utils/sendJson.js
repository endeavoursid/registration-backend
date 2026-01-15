export function sendJson(res, statusCode, payload) {
  if (res.headersSent) return;

  res
    .status(statusCode)
    .json(payload);
}
