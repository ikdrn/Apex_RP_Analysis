/**
 * Vercel Serverless Function (CommonJS)
 *
 * NOTE:
 * This file intentionally uses CommonJS (`module.exports`) so it can run
 * in environments that execute API functions as CJS.
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const supabaseUrl = process.env['SUPABASE_URL'];
  const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({
      error: 'Missing env vars: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    });
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
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
      return res.status(500).json({ error: `Supabase error: ${body}` });
    }

    return res.status(200).json(JSON.parse(body));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
};
