const SYSTEM_PROMPT = `You are WARRIOR, a sickle cell disease crisis management AI. Respond ONLY with valid JSON — no markdown.
Format: {"severity":"safe|warning|emergency","verdict":"short 6-word decision","reasoning":"2-sentence plain explanation","pre_hospital":["5 actions before ER"],"steps":["4 action steps"],"home_care":{"hydration":"instruction","medication":"OTC med dose timing","heat_therapy":"instruction","rest":"instruction","review_in":"when to reassess"},"escalate_if":["4 ER warning signs"],"doctor_note":"professional 2-sentence ER note","watch_for":["3 danger signs"]}
Rules: emergency=ANY fever/chest pain/breathing difficulty/priapism/stroke/pain>=8. warning=pain 5-7. safe=pain 1-4. Never dismiss pain.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { pain, location, symptoms } = req.body;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${process.env.GEMMA_API_KEY}`,
      {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: `Sickle cell crisis: Pain ${pain}/10, Location: ${location}, Symptoms: ${symptoms || 'None'}` }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1200 }
        })
      }
    );
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return res.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
  } catch (e) {
    return res.status(500).json({ error: 'Assessment failed' });
  }
}
