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

  const forbudtListe = `FORBUDTE ingredienser (giver STOP):
Gluten: hvede, hvedemel, hvedeprotein, hvedestivelse, hvedekim, hvedeklid, durumhvede, speltkerner, rug, rugmel, bygmel, byggryn, perlebyg, bygmalt, spelt, malt, maltekstrakt, maltsirup, havre, havregryn, havreklid, gluten, glucosesirup, dextrose, maltodextrin, maltose, semulje, bulgur, couscous, emmer, kamut
Maelk: maelk, mælk, skummetmælk, sødmælk, mælkeprotein, mælkebestanddele, mælketørstof, tørmælk, valle, valleprotein, kasein, kaliumkaseinat, natriumkaseinat, laktose, smøreolie, smøraroma, fløde, inddampet mælk, mælkepulver, skummetmælkspulver, sødmælkspulver
Soja: soja, sojamælk, sojaprotein, sojalecithin, tofu, edamame
E-numre: E1404, E1412, E1413, E1414, E1420, E1422, E1440, E1442, E1450, E1451`;

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
          { type: 'text', text: `Find ingredienslisten paa dette produkt og analyser det.

${forbudtListe}
${kendteTekst}

Svar KUN med JSON uden tekst udenfor:
{"produktNavn":"","ingredienser":"komplet liste","enumre":["E-numre"],"sikker":false,"advarsler":["advarsel"],"skjulte_risici":[],"forklaring":"forklaring til barn","karakter":"STOP","kendte_matches":["kendte ingredienser"]}

karakter = OK, ADVARSEL eller STOP` }
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
      advarsler:['Billedet var utydeligt - proev igen med bedre lys'],
      skjulte_risici:[], forklaring:'Tag et nyt foto tæt paa med godt lys.', karakter:'ADVARSEL', kendte_matches:[] };
  }

  if (!analyse.kendte_matches) analyse.kendte_matches = [];

  return res.status(200).json({
    found: true, produktNavn: analyse.produktNavn || '', ingredienser: analyse.ingredienser || '',
    enumre: analyse.enumre || [], kilde: 'foto', fundneForbudte: [], analyse
  });
}
