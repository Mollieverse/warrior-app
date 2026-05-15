export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const headers = { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };

  if (req.method === 'GET') {
    const { device_id } = req.query;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/episodes?device_id=eq.${device_id}&order=created_at.desc`, { headers });
    return res.json(await r.json());
  }

  if (req.method === 'POST') {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/episodes`, {
      method: 'POST', headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(req.body)
    });
    return res.json(await r.json());
  }
}
