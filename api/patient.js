export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const headers = { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };

  if (req.method === 'GET') {
    const { device_id } = req.query;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/patients?device_id=eq.${device_id}&limit=1`, { headers });
    const data = await r.json();
    return res.json(data[0] || null);
  }

  if (req.method === 'POST') {
    const { device_id, ...profile } = req.body;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/patients?device_id=eq.${device_id}`, {
      method: 'PATCH', headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(profile)
    });
    if (r.status === 404 || (await r.clone().json()).length === 0) {
      const r2 = await fetch(`${SUPABASE_URL}/rest/v1/patients`, {
        method: 'POST', headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ device_id, ...profile })
      });
      return res.json(await r2.json());
    }
    return res.json(await r.json());
  }
}
