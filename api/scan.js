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
      return res.status(200).json({ found: false, besked: 'Produkt ikke fundet. Indsaet ingredienslisten manuelt.' });
    }

  // Hent kendte problematiske ingredienser fra roed/gul markerede produkter
  let kendteIngredienser = [];
  let kendteNavne = [];
  try {
    const sbRes = await fetch(
      process.env.SUPABASE_URL + '/rest/v1/produkter?markering=in.(roed,gul)&select=navn,ingredienser,enumre,markering',
      { headers: { 'apikey': process.env.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + process.env.SUPABASE_ANON_KEY } }
    );
    if (sbRes.ok) {
      const kendte = await sbRes.json();
      kendte.forEach(p => {
        kendteNavne.push({ navn: p.navn, markering: p.markering });
        if (p.ingredienser) {
          p.ingredienser.toLowerCase().split(/[,;()\/]/).forEach(i => {
            const t = i.trim().replace(/[*%]/g, '');
            if (t.length > 2) kendteIngredienser.push(t);
          });
        }
        if (p.enumre) p.enumre.forEach(e => kendteIngredienser.push(e.toLowerCase()));
      });
      kendteIngredienser = [...new Set(kendteIngredienser)].slice(0, 80);
    }
  } catch(e) { /* fortsaet uden kendte */ }
  const kendteTekst = kendteIngredienser.length > 0
    ? '\nKENDTE PROBLEMATISKE INGREDIENSER (fra produkter familien har reageret paa - ANGIV dem der optræder i kendte_matches): ' + kendteIngredienser.join(', ')
    : '';

    // FULD forbudsliste fra Allergi- og Lungeklinikken Aarhus
    const forbudt = [
      // Gluten - korn
      'hvede','hvedemel','hvedeprotein','hydrolyseret hvedeprotein','hvedestivelse',
      'hvedekim','hvedeklid','durumhvede','speltkerner','hvedekim',
      'rug','rugmel','rugkerner','byg','bygmel','bygkerner','byggryn','perlebyg','bygmalt',
      'spelt','speltkerner','fuldkornsmel','grahammel','semulje','semolina',
      'bulgur','couscous','emmer','enkorn','kamut',
      'malt','maltekstrakt','maltsirup','maltmel',
      'havre','havregryn','havremel','havreklid',
      'gluten','glutenholdig',
      // Gluten - skjulte
      'glucosesirup','dextrose','maltodextrin','maltose',
      // Mælk
      'maelk','mælk','skummetmaelk','skummetmælk','soedmaelk','sødmælk',
      'maelkeprotein','mælkeprotein','maelkebestanddele','mælkebestanddele',
      'maelketoerstof','mælketørstof','toermaelk','tørmælk',
      'valle','valleprotein','vallepulver','lactaalbumin','lactalbumin',
      'kasein','kaliumkaseinat','natriumkaseinat','casein',
      'laktose','lactose',
      'smoereolie','smøreolie','smoer','smør','smoearoma','smøraroma',
      'floede','fløde','inddampet maelk','inddampet mælk',
      'maelkepulver','mælkepulver','skummetmaelkspulver','skummetmælkspulver',
      'soedmaelkspulver','sødmælkspulver',
      // Soja
      'soja','sojamaelk','sojamælk','sojafloede','sojafløde',
      'sojaprotein','sojalecithin','sojamel','tofu','edamame',
      // E-numre med gluten/mælk risiko
      'E1404','E1412','E1413','E1414','E1420','E1422','E1440','E1442','E1450','E1451'
    ];

    const ing_lower = ingredienser.toLowerCase();
    const fundne = forbudt.filter(f => ing_lower.includes(f.toLowerCase()));

    // Tjek om kendte ingredienser optræder
    const kendteMatches = kendteIngredienser.filter(k => ing_lower.includes(k));

    const claudePrompt = `Du er allergiekspert. Analyser disse ingredienser for en person med glutenallergi og mælkeallergi.
Produkt: "${produktNavn || 'ukendt'}"
Ingredienser: "${ingredienser}"

FORBUDTE ingredienser fundet: ${fundne.length > 0 ? fundne.join(', ') : 'ingen fra listen'}
${kendteTekst}

Svar KUN med JSON - ingen tekst udenfor:
{"ingredienser":"${ingredienser.replace(/"/g,"'").substring(0,500)}","enumre":["E-numre fra listen"],"sikker":false,"advarsler":["konkret advarsel"],"skjulte_risici":["skjult risiko"],"forklaring":"Kort forklaring til et barn paa 10 aar","karakter":"STOP","kendte_matches":["kendte ingredienser der optræder"]}

karakter skal vaere: OK (ingen problemer), ADVARSEL (mulig risiko), STOP (indeholder forbudte ingredienser)`;

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
    if (!analyse) analyse = {
      ingredienser, enumre: [], sikker: fundne.length === 0,
      advarsler: fundne.length > 0 ? ['Indeholder: ' + fundne.join(', ')] : [],
      skjulte_risici: [], forklaring: 'Tjek ingredienslisten grundigt.',
      karakter: fundne.length > 0 ? 'STOP' : 'OK',
      kendte_matches: kendteMatches
    };

    // Sikr at kendte_matches altid er sat
    if (!analyse.kendte_matches) analyse.kendte_matches = kendteMatches;

    return res.status(200).json({
      found: true, produktNavn: produktNavn || '', ingredienser,
      enumre: analyse.enumre || [], kilde: barcode ? 'barcode' : 'ocr',
      fundneForbudte: fundne, analyse
    });

  } catch(e) {
    return res.status(200).json({ found: false, besked: 'Fejl: ' + e.message });
  }
}
