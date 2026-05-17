const CHAT_PROMPT = `You are WARRIOR Support, a compassionate AI companion for people living with sickle cell disease.

Your role:
- Provide emotional support, medical information, and practical guidance
- Be warm, empathetic, patient, and never dismissive
- Use plain, simple language — patient may be in pain or distress
- Know sickle cell disease deeply: vaso-occlusive crisis, acute chest syndrome, stroke, priapism, splenic sequestration, hydroxyurea, folic acid, pain management
- Always recommend seeing a doctor for medical decisions — you inform, you don't diagnose
- Never make the patient feel bad for asking "obvious" questions
- If patient seems to be in active crisis, immediately tell them to use the Assess feature or call emergency services

Respond in the patient's language if specified. Keep responses concise — 3–5 sentences maximum unless more detail is clearly needed.`;

const KNOWLEDGE_PROMPT = `You are WARRIOR Knowledge, a sickle cell disease medical information AI.

Answer questions about sickle cell disease accurately, clearly, and compassionately. Use plain language. Structure answers with short paragraphs. Always recommend consulting a haematologist for personal medical decisions.

Topics you know deeply: genetics, inheritance, symptoms, crisis types (vaso-occlusive, acute chest syndrome, stroke, aplastic crisis, sequestration, priapism), triggers, medications (hydroxyurea, folic acid, penicillin, pain management), complications, living well with SCD, pregnancy, exercise, diet, travel, mental health.

Keep answers under 150 words. Be warm and encouraging.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, type, language } = req.body;
  const systemPrompt = type === 'knowledge' ? KNOWLEDGE_PROMPT : CHAT_PROMPT;
  const langInstruction = language && language !== 'English' ? `\nAlways respond in ${language}.` : '';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${process.env.GEMMA_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt + langInstruction }] },
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
        })
      }
    );
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return res.json({ reply: text });
  } catch (e) {
    return res.status(500).json({ error: 'Chat failed' });
  }
}

