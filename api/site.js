const { readSite, sendJson } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  try {
    sendJson(res, 200, await readSite());
  } catch {
    sendJson(res, 500, { error: 'Server error' });
  }
};
