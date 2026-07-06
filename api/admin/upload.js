const crypto = require('crypto');
const path = require('path');
const { sendJson, isAuthed, readMultipart } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  if (!isAuthed(req)) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    sendJson(res, 400, { error: 'Загрузка на Vercel требует Blob Storage (BLOB_READ_WRITE_TOKEN)' });
    return;
  }

  try {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) {
      sendJson(res, 400, { error: 'Expected multipart' });
      return;
    }
    const boundary = boundaryMatch[1];
    const raw = await readMultipart(req);
    const parts = raw.toString('binary').split(`--${boundary}`);
    let fileName = '';
    let fileData = null;
    for (const part of parts) {
      if (!part.includes('filename=')) continue;
      const nameMatch = part.match(/filename="([^"]+)"/);
      const idx = part.indexOf('\r\n\r\n');
      if (!nameMatch || idx === -1) continue;
      fileName = nameMatch[1];
      const end = part.lastIndexOf('\r\n');
      fileData = Buffer.from(part.slice(idx + 4, end), 'binary');
    }
    if (!fileData || !fileName) {
      sendJson(res, 400, { error: 'No file' });
      return;
    }
    const ext = path.extname(fileName).toLowerCase() || '.png';
    if (!['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) {
      sendJson(res, 400, { error: 'Unsupported file type' });
      return;
    }

    const { put } = require('@vercel/blob');
    const safeName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    const blobPath = `uploads/${safeName}`;
    const mime = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    }[ext];

    const blob = await put(blobPath, fileData, {
      access: 'public',
      contentType: mime,
      addRandomSuffix: false,
    });

    sendJson(res, 200, { path: blob.url });
  } catch {
    sendJson(res, 500, { error: 'Upload failed' });
  }
};
