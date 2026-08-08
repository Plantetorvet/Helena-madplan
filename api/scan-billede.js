export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(200).json({ found: false, besked: 'Kun POST' });

  let billede;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    billede = body?.billede;
  } catch(e) {
    return res.status(200).json({ found: false, besked: 'Parse fejl' });
  }

  if (!billede || billede.length < 50) {
    return res.status(200).json({ found: false, besked: 'Intet billede' });
  }

  let mediaType = 'image/jpeg';
  if (billede.startsWith('iVBOR')) mediaType = 'image/png';
  else if (billede.startsWith('UklGR')) mediaType = 'image/webp';

  // Hent kendte problematiske ingredienser fra roed/gul markerede produkter
  let kendteIngredienser = [];
  try {
    const sbRes = await fetch(
      process.env.SUPABASE_URL + '/rest/v1/produkter?markering=in.(roed,gul)&select=ingredienser,enumre,navn',
      { headers: { 'apikey': process.env.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + process.env.SUPABASE_ANON_KEY } }
    );
    if (sbRes.ok) {
      const produkter = await sbRes.json();
      produkter.forEach(p => {
        if (p.ingredienser) {
          p.ingredienser.toLowerCase().split(/[,;]/).forEach(i => {
            const trimmed = i.trim().replace(/[()]/g, '');
            if (trimmed.length > 2) kendteIngredienser.push(trimmed);
          });
        }
        if (p.enumre) kendteIngredienser.push(...p.enumre.map(e => e.toLowerCase()));
      });
      kendteIngredienser = [...new Set(kendteIngredienser)].slice(0, 50);
    }
  } catch(e) { /* fortsaet uden kendte */ }
  const kendteTekst = kendteIngredienser.length > 0
    ? '\nKENDTE PROBLEMATISKE INGREDIENSER (fra tidligere reaktioner - marker disse som kendte_matches hvis de optræder): ' + kendteIngredienser.join(', ')
    : '';

  let rawText = '';
  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: billede } },
          { type: 'text', text: 'Find ingredienslisten paa dette produkt. Tjek for gluten (hvede, rug, byg, spelt, havre, malt) og maelk (maelk, smoer, floede, valle, kasein, laktose, maelkepulver) og soja.' + kendteTekst + '\n\nSvar KUN med JSON uden tekst udenfor:\n{"produktNavn":"","ingredienser":"","enumre":[],"sikker":true,"advarsler":[],"skjulte_risici":[],"forklaring":"","karakter":"OK","kendte_matches":[]}\n\nkarakter = OK, ADVARSEL eller STOP' }
        ]}]
      })
    });

    if (!apiRes.ok) {
      return res.status(200).json({ found: false, besked: 'AI svarede ' + apiRes.status + ' - proev igen' });
    }
    const data = await apiRes.json();
    rawText = (data.content?.[0]?.text || '').trim();
  } catch(e) {
    return res.status(200).json({ found: false, besked: 'Netvaerksfejl: ' + e.message });
  }

  let analyse = null;
  try { analyse = JSON.parse(rawText); } catch(e) {}
  if (!analyse) { try { analyse = JSON.parse(rawText.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim()); } catch(e) {} }
  if (!analyse) { try { const m = rawText.match(/\{[\s\S]*\}/); if(m) analyse = JSON.parse(m[0]); } catch(e) {} }
  if (!analyse) {
    analyse = { produktNavn:'', ingredienser:'', enumre:[], sikker:false,
      advarsler:['Billedet var utydeligt - proev med bedre lys'], skjulte_risici:[],
      forklaring:'Tag et nyt foto tæt paa med godt lys.', karakter:'ADVARSEL', kendte_matches:[] };
  }

  return res.status(200).json({
    found: true, produktNavn: analyse.produktNavn||'', ingredienser: analyse.ingredienser||'',
    enumre: analyse.enumre||[], kilde: 'foto', fundneForbudte: [], analyse
  });
}
