const { sendJson, clearSessionCookie } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
};
