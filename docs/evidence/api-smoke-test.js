const handler = require('../../api/get-rp.js');

function createRes() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    }
  };
}

async function run() {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'dummy';

  global.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify([{ id: 1, rp: 1000, created_at: '2026-01-01T00:00:00Z' }])
  });

  const getReq = { method: 'GET', headers: {}, query: { days: '7' }, socket: { remoteAddress: '127.0.0.1' } };
  const getRes = createRes();
  await handler(getReq, getRes);
  console.log('GET status:', getRes.statusCode);
  console.log('GET count:', Array.isArray(getRes.body) ? getRes.body.length : 'not-array');

  const postReq = { method: 'POST', headers: {}, query: {}, socket: { remoteAddress: '127.0.0.1' } };
  const postRes = createRes();
  await handler(postReq, postRes);
  console.log('POST status:', postRes.statusCode);
  console.log('POST error:', postRes.body?.error);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
