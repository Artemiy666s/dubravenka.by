const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const SITE_FILE = path.join(DATA_DIR, 'site.json');
const UPLOADS_DIR = path.join(ROOT, 'assets', 'images', 'uploads');
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'dubravenka';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const sessions = new Map();

function hashPassword(password) {
  return crypto.createHash('sha256').update(`${password}:dubravenka-admin`).digest('hex');
}

const ADMIN_HASH = hashPassword(ADMIN_PASSWORD);

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach(part => {
    const [k, ...v] = part.trim().split('=');
    if (k) out[k] = decodeURIComponent(v.join('='));
  });
  return out;
}

function readBody(req) {
  const body = req.body;
  if (body !== undefined && body !== null && body !== '') {
    if (typeof body === 'object' && !Buffer.isBuffer(body)) {
      return Promise.resolve(body);
    }
    const raw = Buffer.isBuffer(body) ? body.toString('utf8') : String(body);
    if (!raw) return Promise.resolve({});
    try {
      return Promise.resolve(JSON.parse(raw));
    } catch {
      return Promise.reject(new Error('Invalid JSON'));
    }
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function readMultipart(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sendJson(res, status, data, extraHeaders = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...extraHeaders,
  });
  res.end(body);
}

function getToken(req) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies.admin_token || req.headers['x-admin-token'] || '';
}

function isAuthed(req) {
  const token = getToken(req);
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expires) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function readSite() {
  return JSON.parse(fs.readFileSync(SITE_FILE, 'utf8'));
}

function writeSite(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SITE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function safePath(urlPath) {
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) return null;
  return filePath;
}

function serveStatic(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/site' && req.method === 'GET') {
    sendJson(res, 200, readSite());
    return true;
  }

  if (url.pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      if (hashPassword(body.password || '') !== ADMIN_HASH) {
        sendJson(res, 401, { error: 'Неверный пароль' });
        return true;
      }
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, { expires: Date.now() + SESSION_TTL_MS });
      sendJson(res, 200, { ok: true, token }, {
        'Set-Cookie': `admin_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}`,
      });
    } catch {
      sendJson(res, 400, { error: 'Bad request' });
    }
    return true;
  }

  if (url.pathname === '/api/admin/logout' && req.method === 'POST') {
    const token = getToken(req);
    sessions.delete(token);
    sendJson(res, 200, { ok: true }, {
      'Set-Cookie': 'admin_token=; HttpOnly; Path=/; Max-Age=0',
    });
    return true;
  }

  if (url.pathname === '/api/admin/session' && req.method === 'GET') {
    sendJson(res, 200, { authed: isAuthed(req) });
    return true;
  }

  if (url.pathname === '/api/admin/site') {
    if (!isAuthed(req)) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return true;
    }
    if (req.method === 'GET') {
      sendJson(res, 200, readSite());
      return true;
    }
    if (req.method === 'PUT') {
      try {
        const body = await readBody(req);
        writeSite(body);
        sendJson(res, 200, { ok: true });
      } catch {
        sendJson(res, 400, { error: 'Invalid data' });
      }
      return true;
    }
  }

  if (url.pathname === '/api/admin/upload' && req.method === 'POST') {
    if (!isAuthed(req)) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return true;
    }
    try {
      const contentType = req.headers['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)$/);
      if (!boundaryMatch) {
        sendJson(res, 400, { error: 'Expected multipart' });
        return true;
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
        return true;
      }
      const ext = path.extname(fileName).toLowerCase() || '.png';
      if (!['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) {
        sendJson(res, 400, { error: 'Unsupported file type' });
        return true;
      }
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      const safeName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
      const dest = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(dest, fileData);
      const publicPath = `assets/images/uploads/${safeName}`;
      sendJson(res, 200, { path: publicPath });
    } catch {
      sendJson(res, 500, { error: 'Upload failed' });
    }
    return true;
  }

  if (url.pathname === '/api/admin/delete-image' && req.method === 'POST') {
    if (!isAuthed(req)) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return true;
    }
    try {
      const body = await readBody(req);
      const imagePath = body.path || body.url || '';
      if (!imagePath) {
        sendJson(res, 400, { error: 'Не указан путь к файлу' });
        return true;
      }
      if (/^https?:\/\//i.test(imagePath)) {
        sendJson(res, 400, { error: 'Удаление внешних URL доступно только на Vercel' });
        return true;
      }
      if (imagePath.startsWith('assets/images/uploads/')) {
        const file = path.join(ROOT, imagePath);
        if (fs.existsSync(file)) fs.unlinkSync(file);
        sendJson(res, 200, { ok: true });
        return true;
      }
      sendJson(res, 400, { error: 'Можно удалять только загруженные фото' });
    } catch {
      sendJson(res, 500, { error: 'Не удалось удалить файл' });
    }
    return true;
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith('/api/')) {
    try {
      const handled = await handleApi(req, res, url);
      if (handled) return;
    } catch {
      sendJson(res, 500, { error: 'Server error' });
      return;
    }
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  let urlPath = decodeURIComponent(url.pathname);
  if (urlPath === '/') urlPath = '/index.html';
  if (urlPath === '/admin') urlPath = '/admin/index.html';

  const filePath = safePath(urlPath);
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  serveStatic(filePath, res);
});

server.listen(PORT, () => {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`Server ready at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log('Default admin password: dubravenka (set ADMIN_PASSWORD env to change)');
  }
});
