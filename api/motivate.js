export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { habitName, streak, lang } = req.body;
  if (!habitName) {
    return res.status(400).json({ error: 'habitName required' });
  }

  const prompt = lang === 'de'
    ? `Ich habe gerade meine Gewohnheit "${habitName}" abgeschlossen! Aktuelle Serie: ${streak} ${streak === 1 ? 'Tag' : 'Tage'}. Schreib eine kurze, motivierende Nachricht auf Deutsch (max. 2 Sätze).`
    : `I just completed my habit "${habitName}"! Current streak: ${streak} ${streak === 1 ? 'day' : 'days'}. Write a short, energizing motivational message (max 2 sentences).`;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 120,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: err.error?.message || 'Upstream error' });
    }

    const data = await upstream.json();
    const message = data.content?.[0]?.text?.trim() || '';
    return res.status(200).json({ message });
  } catch {
    return res.status(500).json({ error: 'Internal error' });
  }
}
