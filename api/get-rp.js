/**
 * Vercel Serverless Function (CommonJS)
 */

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const BUCKET_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const requestBuckets = new Map();
let lastBucketCleanup = Date.now();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function cleanExpiredBuckets(now) {
  for (const [ip, bucket] of requestBuckets) {
    if (now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
      requestBuckets.delete(ip);
    }
  }
  lastBucketCleanup = now;
}

function isRateLimited(clientIp) {
  const now = Date.now();

  if (now - lastBucketCleanup >= BUCKET_CLEANUP_INTERVAL_MS) {
    cleanExpiredBuckets(now);
  }

  const bucket = requestBuckets.get(clientIp);

  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    requestBuckets.set(clientIp, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

function getAllowedOrigin(req) {
  const configuredOrigin = process.env['ALLOWED_ORIGIN'];

  if (!configuredOrigin || configuredOrigin === '*') {
    return '*';
  }

  const requestOrigin = req.headers.origin;
  return requestOrigin === configuredOrigin ? configuredOrigin : 'null';
}

function validateBasicAuth(req) {
  const authUser = process.env['BASIC_AUTH_USER'];
  const authPass = process.env['BASIC_AUTH_PASS'];

  if (!authUser || !authPass) {
    return { ok: true };
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Basic ')) {
    return { ok: false, reason: 'missing' };
  }

  try {
    const encoded = header.slice('Basic '.length);
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    const user = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : '';
    const pass = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : '';

    if (user === authUser && pass === authPass) {
      return { ok: true };
    }
    return { ok: false, reason: 'invalid' };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

module.exports = async function handler(req, res) {
  const allowedOrigin = getAllowedOrigin(req);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authCheck = validateBasicAuth(req);
  if (!authCheck.ok) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Apex RP Analysis"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    console.warn('[get-rp] rate limited', { clientIp });
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const supabaseUrl = process.env['SUPABASE_URL'];
  const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !serviceKey) {
    console.error('[get-rp] missing env vars');
    return res.status(500).json({ error: 'Missing env vars: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
  }

  const rawDays = typeof req.query?.days === 'string' ? req.query.days : '30';
  const parsedDays = Number.parseInt(rawDays, 10);
  const allowedDays = [7, 30];
  const days = allowedDays.includes(parsedDays) ? parsedDays : 30;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/player_rp?select=id,rp,created_at&created_at=gte.${since}&order=created_at.asc`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    });

    const body = await response.text();

    if (!response.ok) {
      console.error('[get-rp] supabase error', { status: response.status, body });
      return res.status(500).json({ error: `Supabase error: ${body}` });
    }

    const parsedBody = JSON.parse(body);
    console.info('[get-rp] success', { days, count: Array.isArray(parsedBody) ? parsedBody.length : 0 });
    return res.status(200).json(parsedBody);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[get-rp] unexpected error', { message });
    return res.status(500).json({ error: message });
  }
};
