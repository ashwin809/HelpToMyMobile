import { z } from 'zod';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(1600),
});

const requestSchema = z.object({
  message: z.string().trim().min(1).max(600),
  history: z.array(messageSchema).max(8).default([]),
});

const instructions = [
  'You are HelpToYou, an academic study and career guidance assistant for students and aspiring applicants.',
  'Give clear, supportive, age-appropriate explanations and practical next steps.',
  'Do not claim to have verified current admissions, scholarship, financial-aid, or deadline information. Direct users to the official institution or program source for current requirements.',
  'Do not request passwords, authentication codes, or unnecessary sensitive personal information.',
  'For medical, legal, crisis, or other high-stakes matters, encourage the user to contact a qualified professional or appropriate local service.',
].join(' ');

export async function askAcademicAssistant(req, res) {
  const { message, history } = requestSchema.parse(req.body);
  const apiKey = process.env.LLM_API_KEY || process.env.GROQ_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!apiKey || !model) {
    return res.status(503).json({ error: 'The AI assistant is not configured. Set LLM_API_KEY (or GROQ_API_KEY) and LLM_MODEL in server/.env.' });
  }

  const apiUrl = process.env.LLM_API_URL || 'https://api.groq.com/openai/v1/responses';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions,
        input: [
          ...history.map(({ role, content }) => ({ role, content })),
          { role: 'user', content: message },
        ],
        max_output_tokens: 700,
        store: false,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      console.error(`[AI assistant] Provider returned HTTP ${response.status}.`);
      return res.status(response.status === 429 ? 503 : 502).json({
        error: response.status === 429
          ? 'The AI assistant is busy. Please try again shortly.'
          : 'The AI assistant is temporarily unavailable.',
      });
    }

    const result = await response.json();
    const reply = (result.output || [])
      .flatMap((item) => item.content || [])
      .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
      .map((item) => item.text)
      .join('\n')
      .trim();

    if (!reply) {
      console.error('[AI assistant] Provider returned no text output.');
      return res.status(502).json({ error: 'The AI assistant could not prepare a reply. Please try again.' });
    }

    return res.json({ reply });
  } catch (error) {
    console.error(`[AI assistant] Request failed: ${error.name || 'Error'}.`);
    return res.status(502).json({ error: 'The AI assistant is temporarily unavailable. Please try again.' });
  }
}
