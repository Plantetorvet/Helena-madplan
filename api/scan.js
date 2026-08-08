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
      return res.status(200).json({ found: false, besked: 'Produkt ikke fundet i database. Prøv at tage et foto af ingredienslisten.' });
    }

    const forbudt = ['hvede','hvedeprotein','rug','byg','spelt','malt','havre','gluten','mælk','skummetmælk','sødmælk','mælkeprotein','valle','kasein','laktose','smøreolie','mælkepulver','soja','sojaprotein','sojalecithin','E1404','E1412','E1413','E1414','E1420','E1422','E1440','E1442','E1450','E1451'];
    const fundne = forbudt.filter(f => ingredienser.toLowerCase().includes(f.toLowerCase()));

    const claudePrompt = `Analyser disse ingredienser for glutenallergi og mælkeallergi.
Produkt: "${produktNavn || 'ukendt'}"
Ingredienser: "${ingredienser}"
Allerede fundne problemer: ${fundne.length > 0 ? fundne.join(', ') : 'ingen'}

Svar KUN med JSON:
{"ingredienser":"${ingredienser.replace(/"/g,"'")}","enumre":["E-numre"],"sikker":true,"advarsler":[],"skjulte_risici":[],"forklaring":"forklaring","karakter":"OK","kendte_matches":[]}`;

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

    return res.status(200).json({ found: true, produktNavn: produktNavn||'', ingredienser, enumre: analyse.enumre||[], kilde: barcode?'barcode':'ocr', fundneForbudte: fundne, analyse });

  } catch(e) {
    return res.status(200).json({ found: false, besked: 'Fejl: ' + e.message });
  }
}
