const { sendJson, isAuthed, readBody, readSite, writeSite } = require('../_lib');

module.exports = async (req, res) => {
  if (!isAuthed(req)) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return;
  }

  if (req.method === 'GET') {
    try {
      sendJson(res, 200, await readSite());
    } catch {
      sendJson(res, 500, { error: 'Server error' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const body = await readBody(req);
      await writeSite(body);
      sendJson(res, 200, { ok: true });
    } catch (err) {
      const msg = err.message === 'BLOB_READ_WRITE_TOKEN is not configured'
        ? 'Сохранение на Vercel требует Blob Storage (BLOB_READ_WRITE_TOKEN)'
        : 'Invalid data';
      sendJson(res, 400, { error: msg });
    }
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
};
