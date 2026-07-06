const {
  hashPassword,
  adminHash,
  readBody,
  sendJson,
  createSessionToken,
  sessionCookie,
} = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  try {
    const body = await readBody(req);
    if (hashPassword(body.password || '') !== adminHash()) {
      sendJson(res, 401, { error: 'Неверный пароль' });
      return;
    }
    const token = createSessionToken();
    sendJson(res, 200, { ok: true, token }, { 'Set-Cookie': sessionCookie(token) });
  } catch {
    sendJson(res, 400, { error: 'Bad request' });
  }
};
