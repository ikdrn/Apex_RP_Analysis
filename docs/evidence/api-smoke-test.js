// HTTP smoke test for the Go (Echo) /api/rp endpoint.
//
// Run against a local `vercel dev` server or a deployed preview:
//   API_BASE=https://your-preview.vercel.app node docs/evidence/api-smoke-test.js
//
// Requires Node 18+ (global fetch).
const BASE = process.env.API_BASE || 'http://localhost:3000';

async function check(days) {
  const url = `${BASE}/api/rp?days=${days}`;
  const res = await fetch(url);
  const body = await res.json();
  console.log(`GET ${url}`);
  console.log(`  status: ${res.status}`);
  console.log(`  total: ${body.total}, displayed: ${body.displayed}, cached: ${body.cached}`);
  console.log(`  period: ${body.period?.start} -> ${body.period?.end}`);

  const ok = res.status === 200 && Array.isArray(body.data) && typeof body.total === 'number';
  if (!ok) {
    throw new Error(`unexpected response for days=${days}: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return body;
}

async function run() {
  const all = await check('all');
  const d30 = await check('30');

  // The all-period window must contain at least as many rows as 30 days.
  if (all.total < d30.total) {
    throw new Error(`all total (${all.total}) < 30d total (${d30.total})`);
  }

  console.log('\nOK: /api/rp smoke test passed.');
}

run().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
