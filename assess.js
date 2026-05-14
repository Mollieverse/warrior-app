// api/assess.js — Vercel Serverless Function
// Proxies requests to Gemma 4 via Google AI Studio
// API key stays safe on the server — never exposed to browser

const SYSTEM_PROMPT = `You are WARRIOR, a sickle cell disease crisis management AI.
Respond ONLY with valid JSON — no markdown, no preamble.
Format exactly:
{"severity":"safe|warning|emergency","verdict":"short 6-word decision","reasoning":"2-sentence plain language explanation","pre_hospital":["5 actions before leaving for ER"],"steps":["4 main action steps"],"home_care":{"hydration":"specific instruction","medication":"OTC med dose timing","heat_therapy":"warm compress instruction","rest":"rest position and restriction","review_in":"when to reassess"},"escalate_if":["4 signs that mean go to ER"],"doctor_note":"professional 2-sentence ER note with pain score and symptoms","watch_for":["3 danger signs to monitor"]}
Rules: emergency=ANY fever/chest pain/breathing difficulty/priapism/stroke signs/pain>=8. warning=pain 5-7 moderate. safe=pain 1-4 no critical. Never dismiss pain.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pain, location, symptoms } = req.body;

  if (!pain || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const prompt = `Sickle cell crisis: Pain ${pain}/10, Location: ${location}, Symptoms: ${symptoms || 'None beyond pain'}. Return full JSON assessment.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${process.env.GEMMA_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1200 }
        })
      }
    );

    const data = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemma API');
    }

    const text = data.candidates[0].content.parts[0].text;
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());

    return res.status(200).json(result);
  } catch (error) {
    console.error('Gemma API error:', error);
    return res.status(500).json({ error: 'Assessment failed. Please try again.' });
  }
}
