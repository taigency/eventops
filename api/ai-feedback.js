// AI feedback analysis — categorises and summarises user feedback for the admin
// POST { message, type, page, userEmail, companyName }
// Uses Claude Haiku via Anthropic API
// Returns { category, aiSummary, priority }

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, type, page, userEmail, companyName } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  if (!ANTHROPIC_API_KEY) {
    // Fallback if no API key configured
    return res.json({ category: type || 'feedback', aiSummary: message.slice(0, 200), priority: 'normal' });
  }

  try {
    const prompt = `You are an AI assistant for EventOps ERP, a South African event management platform currently in free beta.
A user just submitted the following feedback. Analyse it and respond with a JSON object ONLY (no markdown, no code block).

User: ${userEmail || 'unknown'}
Company: ${companyName || 'unknown'}
Page/feature: ${page || 'general'}
Type: ${type || 'feedback'}
Message: "${message}"

Return exactly this JSON structure:
{
  "category": one of ["bug", "feature_request", "question", "praise", "complaint", "suggestion"],
  "aiSummary": "A single sentence (max 120 chars) summarising the key point for the admin",
  "priority": one of ["urgent", "high", "normal", "low"],
  "suggestedReply": "A brief, warm, personalised reply the admin could send (2-3 sentences max)",
  "tags": ["up to 3 relevant feature tags from the message"]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { category: type || 'feedback', aiSummary: message.slice(0, 120), priority: 'normal', suggestedReply: '', tags: [] }; }
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.json({ category: type || 'feedback', aiSummary: message.slice(0, 120), priority: 'normal', suggestedReply: '', tags: [] });
  }
};
