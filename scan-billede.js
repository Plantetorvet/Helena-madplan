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
      return res.status(400).json({ found: false, besked: 'Ugyldigt request' });
    }

    const { billede } = body || {};
    if (!billede || billede.length < 100) {
      return res.status(400).json({ found: false, besked: 'Intet billede modtaget' });
    }

    // Billedformat
    let mediaType = 'image/jpeg';
    if (billede.startsWith('iVBOR')) mediaType = 'image/png';
    else if (billede.startsWith('UklGR')) mediaType = 'image/webp';

    // Hent kendte problematiske ingredienser fra Supabase hvis tilgængeligt
    let kendte_problemer = '';
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      const { data } = await sb.from('produkter').select('navn, ingredienser, markering').in('markering', ['roed', 'gul']);
      if (data && data.length > 0) {
        const ing = [...new Set(data.flatMap(p => (p.ingredienser||'').toLowerCase().split(/[,;]/).map(s=>s.trim()).filter(s=>s.length>2)))];
        kendte_problemer = ing.length > 0 ? `\nKENDTE PROBLEMATISKE INGREDIENSER (fra tidligere reaktioner): ${ing.slice(0,30).join(', ')}` : '';
      }
    } catch(e) {}

    const prompt = `Du er allergiekspert. Se på dette produktbillede og analyser ingredienslisten.
Tjek for: gluten (hvede, rug, byg, spelt, havre, malt, hvedeprotein), mælk (mælk, smør, fløde, valle, kasein, laktose, mælkepulver), soja.
Husk at notere ALLE E-numre du ser.${kendte_problemer}

Svar KUN med dette JSON - INGEN andre ord eller tegn udenfor JSON:
{"produktNavn":"produktets navn","ingredienser":"komplet ingrediensliste med alle E-numre","enumre":["E471","E322"],"sikker":true,"advarsler":["advarsel hvis relevant"],"skjulte_risici":["skjult risiko hvis relevant"],"forklaring":"kort forklaring til et barn","karakter":"OK"}

karakter skal være: OK, ADVARSEL eller STOP`;

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: billede } },
          { type: 'text', text: prompt }
        ]}]
      })
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Anthropic API fejl:', errText);
      return res.status(200).json({ found: false, besked: 'AI-tjenesten svarede ikke — prøv igen om lidt' });
    }

    const data = await apiRes.json();
    const rawText = (data.content?.[0]?.text || '').trim();

    let analyse = null;
    try { analyse = JSON.parse(rawText); } catch(e) {}
    if (!analyse) { try { analyse = JSON.parse(rawText.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim()); } catch(e) {} }
    if (!analyse) { try { const m = rawText.match(/\{[\s\S]*\}/); if(m) analyse = JSON.parse(m[0]); } catch(e) {} }
    if (!analyse) {
      analyse = { produktNavn:'', ingredienser: rawText.substring(0,200), enumre:[], sikker:false, advarsler:['Billedet var utydeligt — prøv med bedre lys og hold 5-15 cm afstand'], skjulte_risici:[], forklaring:'Vi kunne ikke læse ingredienslisten. Tag et nyt foto tæt på, med godt lys og uden skygger.', karakter:'ADVARSEL' };
    }

    return res.status(200).json({ found: true, produktNavn: analyse.produktNavn || '', ingredienser: analyse.ingredienser || '', enumre: analyse.enumre || [], kilde: 'foto', fundneForbudte: [], analyse });

  } catch(e) {
    console.error('scan-billede fejl:', e);
    return res.status(200).json({ found: false, besked: 'Uventet fejl: ' + e.message });
  }
}
