// api/triggers.js — Personal Trigger Detection
// Analyses crisis history with Gemma 4 to find patterns

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { episodes } = req.body;
  if (!episodes || episodes.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 episodes for analysis' });
  }

  const prompt = `You are a sickle cell disease specialist AI. Analyse this patient's crisis history and identify personal triggers and patterns.

Crisis History:
${episodes.map((ep, i) => `Episode ${i+1}: Pain ${ep.pain}/10, Location: ${ep.location}, Date: ${ep.date}, Symptoms: ${ep.symptoms?.join(', ') || 'none listed'}`).join('\n')}

Respond ONLY with valid JSON:
{"patterns":["pattern 1","pattern 2","pattern 3"],"triggers":["likely trigger 1","likely trigger 2"],"prevention":["prevention tip 1","prevention tip 2","prevention tip 3"],"insight":"one powerful personalised insight sentence for this patient"}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${process.env.GEMMA_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 600 }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Analysis failed' });
  }
}
