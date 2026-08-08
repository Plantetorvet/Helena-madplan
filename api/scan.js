export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { barcode, ocrText } = body || {};

    let ingredienser = null, produktNavn = null;

    if (barcode) {
      try {
        const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_da,ingredients_text,ingredients_text_da`);
        const d = await r.json();
        if (d.status === 1 && d.product) {
          produktNavn = d.product.product_name_da || d.product.product_name || '';
          ingredienser = d.product.ingredients_text_da || d.product.ingredients_text || '';
        }
      } catch(e) {}
    }

    if (!ingredienser && ocrText) ingredienser = ocrText;
    if (!ingredienser) {
      return res.status(200).json({ found: false, besked: 'Produkt ikke fundet. Proev at indsaette ingredienslisten manuelt.' });
    }

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

    const forbudt = ['hvede','hvedeprotein','rug','byg','spelt','malt','havre','gluten',
      'maelk','maelk','skummetmaelk','soedmaelk','maelkeprotein','valle','kasein','laktose','smoereolie','maelkepulver',
      'soja','sojaprotein','sojalecithin','E1404','E1412','E1413','E1414','E1420','E1422','E1440','E1442','E1450','E1451'];
    const fundne = forbudt.filter(f => ingredienser.toLowerCase().includes(f.toLowerCase()));

    const claudePrompt = `Analyser disse ingredienser for glutenallergi og maelkeallergi.
Produkt: "${produktNavn || 'ukendt'}"
Ingredienser: "${ingredienser}"
Allerede fundne: ${fundne.length > 0 ? fundne.join(', ') : 'ingen'}${kendteTekst}

Svar KUN med JSON:
{"ingredienser":"${ingredienser.replace(/"/g,"'")}","enumre":[],"sikker":true,"advarsler":[],"skjulte_risici":[],"forklaring":"forklaring","karakter":"OK","kendte_matches":[]}`;

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
    if (!analyse) analyse = { ingredienser, enumre:[], sikker:fundne.length===0, advarsler:fundne, skjulte_risici:[], forklaring:'Tjek listen manuelt.', karakter:fundne.length>0?'ADVARSEL':'OK', kendte_matches:[] };

    return res.status(200).json({ found:true, produktNavn:produktNavn||'', ingredienser, enumre:analyse.enumre||[], kilde:barcode?'barcode':'ocr', fundneForbudte:fundne, analyse });

  } catch(e) {
    return res.status(200).json({ found: false, besked: 'Fejl: ' + e.message });
  }
}
