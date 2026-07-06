const fs = require('fs');
const path = require('path');
const { sendJson, isAuthed, readBody } = require('../_lib');

function isBlobUrl(url) {
  return /^https?:\/\//i.test(url);
}

function isLocalUpload(imagePath) {
  return typeof imagePath === 'string' && imagePath.startsWith('assets/images/uploads/');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  if (!isAuthed(req)) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return;
  }

  try {
    const body = await readBody(req);
    const imagePath = body.path || body.url || '';
    if (!imagePath) {
      sendJson(res, 400, { error: 'Не указан путь к файлу' });
      return;
    }

    if (isBlobUrl(imagePath)) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        sendJson(res, 400, { error: 'Удаление на Vercel требует Blob Storage (BLOB_READ_WRITE_TOKEN)' });
        return;
      }
      const { del } = require('@vercel/blob');
      await del(imagePath);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (isLocalUpload(imagePath)) {
      const file = path.join(process.cwd(), imagePath);
      if (fs.existsSync(file)) fs.unlinkSync(file);
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 400, { error: 'Можно удалять только загруженные фото' });
  } catch {
    sendJson(res, 500, { error: 'Не удалось удалить файл' });
  }
};
