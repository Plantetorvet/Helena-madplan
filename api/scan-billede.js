export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(200).json({ found: false, besked: 'Kun POST' });

  // Parse body sikkert
  let billede;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    billede = body?.billede;
  } catch(e) {
    return res.status(200).json({ found: false, besked: 'Parse fejl: ' + e.message });
  }

  if (!billede || billede.length < 50) {
    return res.status(200).json({ found: false, besked: 'Intet billede' });
  }

  // Detect format
  let mediaType = 'image/jpeg';
  if (billede.startsWith('iVBOR')) mediaType = 'image/png';

  let rawText = '';
  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: billede }
            },
            {
              type: 'text',
              text: 'Find ingredienslisten på dette produkt. Tjek for gluten og mælk. Svar KUN med JSON uden nogen tekst udenfor: {"produktNavn":"","ingredienser":"","enumre":[],"sikker":true,"advarsler":[],"skjulte_risici":[],"forklaring":"","karakter":"OK","kendte_matches":[]}'
            }
          ]
        }]
      })
    });

    if (!apiRes.ok) {
      const err = await apiRes.text();
      return res.status(200).json({ found: false, besked: 'API svarede: ' + apiRes.status + ' — ' + err.substring(0, 100) });
    }

    const data = await apiRes.json();
    rawText = (data.content?.[0]?.text || '').trim();

  } catch(e) {
    return res.status(200).json({ found: false, besked: 'Netværksfejl: ' + e.message });
  }

  // Parse JSON - 3 metoder
  let analyse = null;
  try { analyse = JSON.parse(rawText); } catch(e) {}
  if (!analyse) {
    try { analyse = JSON.parse(rawText.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim()); } catch(e) {}
  }
  if (!analyse) {
    try { const m = rawText.match(/\{[\s\S]*?\}/); if(m) analyse = JSON.parse(m[0]); } catch(e) {}
  }

  // Fallback
  if (!analyse) {
    analyse = {
      produktNavn: '',
      ingredienser: rawText.substring(0, 200) || '',
      enumre: [],
      sikker: false,
      advarsler: ['Billedet var utydeligt — prøv med bedre lys og hold 5-15 cm afstand'],
      skjulte_risici: [],
      forklaring: 'Prøv igen med godt lys og hold telefonen stille.',
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
}
