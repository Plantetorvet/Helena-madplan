export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { barcode, ocrText } = body || {};

    let ingredienser = null, produktNavn = null;

    // Stregkode-opslag
    if (barcode) {
      try {
        const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_da,ingredients_text,ingredients_text_da,additives_tags`);
        const d = await r.json();
        if (d.status === 1 && d.product) {
          produktNavn = d.product.product_name_da || d.product.product_name || '';
          ingredienser = d.product.ingredients_text_da || d.product.ingredients_text || '';
        }
      } catch(e) {}
    }

    if (!ingredienser && ocrText) ingredienser = ocrText;
    if (!ingredienser) return res.status(200).json({ found: false, besked: 'Produktet blev ikke fundet. Prøv at tage et foto af ingredienslisten i stedet.' });

    // Hent kendte problemer
    let kendte_problemer = '';
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      const { data } = await sb.from('produkter').select('navn, ingredienser, markering').in('markering', ['roed', 'gul']);
      if (data && data.length > 0) {
        const ing = [...new Set(data.flatMap(p => (p.ingredienser||'').toLowerCase().split(/[,;]/).map(s=>s.trim()).filter(s=>s.length>2)))];
        if (ing.length > 0) kendte_problemer = `\nKENDTE PROBLEMATISKE INGREDIENSER: ${ing.slice(0,30).join(', ')}`;
      }
    } catch(e) {}

    const forbudt = ['hvede','hvedeprotein','hydrolyseret hvedeprotein','hvedestivelse','rug','byg','spelt','malt','maltekstrakt','havre','gluten','mælk','skummetmælk','sødmælk','mælkeprotein','valle','valleprotein','kasein','kaliumkaseinat','natriumkaseinat','laktose','smøreolie','mælkepulver','skummetmælkspulver','soja','sojamælk','sojaprotein','sojalecithin','tofu','E1404','E1412','E1413','E1414','E1420','E1422','E1440','E1442','E1450','E1451'];
    const fundne = forbudt.filter(f => ingredienser.toLowerCase().includes(f.toLowerCase()));

    const claudePrompt = `Du er allergiekspert. Analyser disse ingredienser for en person med glutenallergi og mælkeallergi.
Ingredienser: "${ingredienser}"
Produkt: "${produktNavn || 'ukendt'}"${kendte_problemer}

Allerede fundne problematiske ingredienser: ${fundne.length > 0 ? fundne.join(', ') : 'ingen'}

Svar KUN med JSON:
{"ingredienser":"${ingredienser}","enumre":["E-numre fra listen"],"sikker":true/false,"advarsler":["advarsel"],"skjulte_risici":["risiko"],"forklaring":"forklaring til barn","karakter":"OK/ADVARSEL/STOP","kendte_matches":["ingredienser der matcher kendte problemer"]}`;

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, messages: [{ role: 'user', content: claudePrompt }] })
    });

    const claudeData = await apiRes.json();
    const raw = (claudeData.content?.[0]?.text || '{}').trim();
    let analyse = null;
    try { analyse = JSON.parse(raw); } catch(e) {}
    if (!analyse) { try { const m = raw.match(/\{[\s\S]*\}/); if(m) analyse = JSON.parse(m[0]); } catch(e) {} }
    if (!analyse) analyse = { ingredienser, enumre:[], sikker:fundne.length===0, advarsler:fundne, skjulte_risici:[], forklaring:'Tjek ingredienslisten grundigt.', karakter: fundne.length>0?'ADVARSEL':'OK', kendte_matches:[] };

    return res.status(200).json({ found: true, produktNavn: produktNavn||'', ingredienser, enumre: analyse.enumre||[], kilde: barcode?'barcode':'ocr', fundneForbudte: fundne, analyse });

  } catch(e) {
    return res.status(200).json({ found: false, besked: 'Fejl: ' + e.message });
  }
}
