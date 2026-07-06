const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const SITE_FILE = path.join(ROOT, 'data', 'site.json');
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const BLOB_PATH = 'data/site.json';

function hashPassword(password) {
  return crypto.createHash('sha256').update(`${password}:dubravenka-admin`).digest('hex');
}

function adminHash() {
  return hashPassword(process.env.ADMIN_PASSWORD || 'dubravenka');
}

function sendJson(res, status, data, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [key, value] of Object.entries(extraHeaders)) {
    res.setHeader(key, value);
  }
  res.end(JSON.stringify(data));
}

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

function createSessionToken() {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${expires}`;
  const sig = crypto.createHmac('sha256', adminHash()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifySessionToken(token) {
  if (!token) return false;
  const [expires, sig] = token.split('.');
  if (!expires || !sig) return false;
  if (Date.now() > Number(expires)) return false;
  const expected = crypto.createHmac('sha256', adminHash()).update(expires).digest('hex');
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function getToken(req) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies.admin_token || req.headers['x-admin-token'] || '';
}

function isAuthed(req) {
  return verifySessionToken(getToken(req));
}

function sessionCookie(token) {
  const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  const parts = [
    `admin_token=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_MS / 1000}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

function clearSessionCookie() {
  return 'admin_token=; HttpOnly; Path=/; Max-Age=0';
}

function readLocalSite() {
  return JSON.parse(fs.readFileSync(SITE_FILE, 'utf8'));
}

async function readSite() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = require('@vercel/blob');
      const { blobs } = await list({ prefix: 'data/', limit: 10 });
      const blob = blobs.find(b => b.pathname === BLOB_PATH) || blobs[0];
      if (blob?.url) {
        const res = await fetch(blob.url);
        if (res.ok) return await res.json();
      }
    } catch {
      /* fallback to bundled file */
    }
  }
  return readLocalSite();
}

async function writeSite(data) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }
  const { put } = require('@vercel/blob');
  await put(BLOB_PATH, JSON.stringify(data, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

module.exports = {
  adminHash,
  hashPassword,
  sendJson,
  readBody,
  readMultipart,
  createSessionToken,
  isAuthed,
  sessionCookie,
  clearSessionCookie,
  readSite,
  writeSite,
};
