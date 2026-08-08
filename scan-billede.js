export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch(e) {
      return res.status(200).json({ found: false, besked: 'Ugyldigt request' });
    }

    const { billede } = body || {};
    if (!billede || billede.length < 100) {
      return res.status(200).json({ found: false, besked: 'Intet billede modtaget' });
    }

    let mediaType = 'image/jpeg';
    if (billede.startsWith('iVBOR')) mediaType = 'image/png';
    else if (billede.startsWith('UklGR')) mediaType = 'image/webp';

    const prompt = `Du er allergiekspert. Kig på dette produktbillede og find ingredienslisten.
Tjek omhyggeligt for: gluten (hvede, rug, byg, spelt, havre, malt), mælk (mælk, smør, fløde, valle, kasein, laktose, mælkepulver), soja.
Notér ALLE E-numre du kan se.

Svar KUN med dette JSON - absolut ingen tekst udenfor JSON-objektet:
{"produktNavn":"navn her","ingredienser":"komplet liste","enumre":["E471"],"sikker":true,"advarsler":[],"skjulte_risici":[],"forklaring":"kort forklaring","karakter":"OK","kendte_matches":[]}

karakter = OK, ADVARSEL eller STOP`;

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: billede } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(200).json({ found: false, besked: 'AI fejlede (' + apiRes.status + ') — prøv igen' });
    }

    const data = await apiRes.json();
    const rawText = (data.content?.[0]?.text || '').trim();

    let analyse = null;
    try { analyse = JSON.parse(rawText); } catch(e) {}
    if (!analyse) {
      try { analyse = JSON.parse(rawText.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim()); } catch(e) {}
    }
    if (!analyse) {
      try { const m = rawText.match(/\{[\s\S]*\}/); if(m) analyse = JSON.parse(m[0]); } catch(e) {}
    }
    if (!analyse) {
      analyse = {
        produktNavn: '',
        ingredienser: rawText.substring(0, 300) || 'Kunne ikke læse',
        enumre: [],
        sikker: false,
        advarsler: ['Billedet var utydeligt — prøv med bedre lys og hold 5-15 cm afstand'],
        skjulte_risici: [],
        forklaring: 'Vi kunne ikke læse ingredienslisten tydeligt. Prøv igen med bedre lys, tæt på teksten.',
        karakter: 'ADVARSEL',
        kendte_matches: []
      };
    }

    return res.status(200).json({
      found: true,
      produktNavn: analyse.produktNavn || '',
      ingredienser: analyse.ingredienser || '',
      enumre: analyse.enumre || [],
      kilde: 'foto',
      fundneForbudte: [],
      analyse
    });

  } catch(e) {
    return res.status(200).json({ found: false, besked: 'Fejl: ' + e.message });
  }
}
