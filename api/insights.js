export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  };

  try {
    // Get all episodes anonymised
    const r = await fetch(`${SUPABASE_URL}/rest/v1/episodes?select=pain,location,severity,symptoms,created_at`, { headers });
    const episodes = await r.json();

    if (!episodes.length) {
      return res.json({
        total: 0,
        er_rate: 0,
        avg_pain: 0,
        top_locations: [],
        top_symptoms: [],
        severity_split: { safe: 0, warning: 0, emergency: 0 },
        peak_hours: []
      });
    }

    // Avg pain
    const avg_pain = (episodes.reduce((a, e) => a + (e.pain || 0), 0) / episodes.length).toFixed(1);

    // ER rate
    const er_count = episodes.filter(e => e.severity === 'emergency').length;
    const er_rate = Math.round((er_count / episodes.length) * 100);

    // Severity split
    const severity_split = {
      safe: Math.round((episodes.filter(e => e.severity === 'safe').length / episodes.length) * 100),
      warning: Math.round((episodes.filter(e => e.severity === 'warning').length / episodes.length) * 100),
      emergency: Math.round((episodes.filter(e => e.severity === 'emergency').length / episodes.length) * 100),
    };

    // Top locations
    const locCount = {};
    episodes.forEach(e => {
      const locs = (e.location || '').split(', ');
      locs.forEach(l => { if (l) locCount[l] = (locCount[l] || 0) + 1; });
    });
    const top_locations = Object.entries(locCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([loc, count]) => ({ loc, pct: Math.round((count / episodes.length) * 100) }));

    // Top symptoms
    const symCount = {};
    episodes.forEach(e => {
      (e.symptoms || []).forEach(s => { symCount[s] = (symCount[s] || 0) + 1; });
    });
    const top_symptoms = Object.entries(symCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([sym, count]) => ({ sym, pct: Math.round((count / episodes.length) * 100) }));

    // Peak hours
    const hourCount = {};
    episodes.forEach(e => {
      if (e.created_at) {
        const h = new Date(e.created_at).getHours();
        const slot = h < 6 ? 'Early morning (12am–6am)' : h < 12 ? 'Morning (6am–12pm)' : h < 18 ? 'Afternoon (12pm–6pm)' : 'Night (6pm–12am)';
        hourCount[slot] = (hourCount[slot] || 0) + 1;
      }
    });
    const peak_hours = Object.entries(hourCount)
      .sort((a, b) => b[1] - a[1])
      .map(([slot, count]) => ({ slot, pct: Math.round((count / episodes.length) * 100) }));

    return res.json({ total: episodes.length, er_rate, avg_pain, top_locations, top_symptoms, severity_split, peak_hours });
  } catch (e) {
    return res.status(500).json({ error: 'Insights failed' });
  }
}

