export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { billede } = body;

    // Detekter billedformat
    let mediaType = 'image/jpeg';
    if (billede.startsWith('iVBOR')) mediaType = 'image/png';
    else if (billede.startsWith('R0lGOD')) mediaType = 'image/gif';
    else if (billede.startsWith('UklGR')) mediaType = 'image/webp';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: billede }
            },
            {
              type: 'text',
              text: `Læs ingredienslisten på dette produktfoto og analyser den.
Tjek for: gluten (hvede, rug, byg, spelt, havre, malt), mælk (mælk, smør, fløde, valle, kasein, laktose), soja.

Svar UDELUKKENDE med rå JSON - ingen forklaring, ingen markdown, ingen backticks:
{"ingredienser":"fuld ingrediensliste som tekst","sikker":true,"advarsler":[],"skjulte_risici":[],"forklaring":"Kort forklaring til et barn på 10 år","karakter":"OK"}`
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const rawText = (data.content?.[0]?.text || '').trim();

    // Robust JSON-parsing - prøv flere metoder
    let analyse = null;

    // Metode 1: Direkte parse
    try { analyse = JSON.parse(rawText); } catch(e) {}

    // Metode 2: Fjern markdown-koder
    if (!analyse) {
      try {
        const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        analyse = JSON.parse(cleaned);
      } catch(e) {}
    }

    // Metode 3: Find JSON-blok med regex
    if (!analyse) {
      try {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) analyse = JSON.parse(match[0]);
      } catch(e) {}
    }

    // Fallback hvis alt fejler
    if (!analyse) {
      analyse = {
        ingredienser: rawText,
        sikker: false,
        advarsler: ['Kunne ikke analysere billedet korrekt - prøv at tage et klarere foto'],
        skjulte_risici: [],
        forklaring: 'Vi kunne ikke læse ingredienslisten tydeligt. Prøv at tage et nyt foto med bedre lys og hold kameraet stille.',
        karakter: 'ADVARSEL'
      };
    }

    return res.status(200).json({
      found: true,
      produktNavn: '',
      ingredienser: analyse.ingredienser || '',
      kilde: 'foto',
      fundneForbudte: [],
      analyse
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
