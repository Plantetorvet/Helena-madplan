export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { barcode, ocrText } = body;

    let ingredienser = null;
    let produktNavn = null;
    let kilde = null;

    // Forsøg stregkode-opslag via Open Food Facts
    if (barcode) {
      try {
        const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,ingredients_text,ingredients_text_da`);
        const offData = await offRes.json();
        if (offData.status === 1 && offData.product) {
          produktNavn = offData.product.product_name || '';
          ingredienser = offData.product.ingredients_text_da || offData.product.ingredients_text || '';
          kilde = 'barcode';
        }
      } catch (e) { /* fortsæt til OCR */ }
    }

    // Fallback: brug OCR-tekst direkte
    if (!ingredienser && ocrText) {
      ingredienser = ocrText;
      kilde = 'ocr';
    }

    if (!ingredienser) {
      return res.status(200).json({ found: false, besked: 'Produktet blev ikke fundet. Prøv at tage et foto af ingredienslisten.' });
    }

    // Forbudsliste (fra Allergi- og Lungeklinikken Aarhus)
    const forbudt = [
      'hvede','hvedeprotein','hydrolyseret hvedeprotein','hvedestivelse',
      'rug','rugmel','rugkerner','bygmel','bygkerner','byggryn','perlebyg','bygmalt',
      'spelt','speltkerner','fuldkorn','graham','semulje','bulgur','couscous','emmer','enkorn','kamut',
      'malt','maltekstrakt','maltsirup',
      'havre','havregryn','havremel','havreklid',
      'gluten',
      'maelk','mælk','skummetmælk','sødmælk','mælkeprotein','valle','valleprotein','vallepulver',
      'kasein','kaliumkaseinat','natriumkaseinat','laktose','smøreolie','smøraroma',
      'inddampet mælk','mælkebestanddele','mælketørstof','tørmælk','lactaalbumin',
      'mælkepulver','skummetmælkspulver','sødmælkspulver',
      'soja','sojamælk','sojafløde','sojaolie','sojaprotein','sojalecithin','tofu','edamame',
      'E1404','E1412','E1413','E1414','E1420','E1422','E1440','E1442','E1450','E1451',
      'glucosesirup','dextrose','maltodextrin','maltose'
    ];

    const ingrediensListe = ingredienser.toLowerCase();
    const fundne = forbudt.filter(f => ingrediensListe.includes(f.toLowerCase()));

    // Brug Claude til uddybende analyse
    const claudePrompt = `Du er en allergiekspert der hjælper en person med glutenallergi og mælkeallergi.

Analyser disse ingredienser og svar KUN med JSON:
Ingredienser: "${ingredienser}"

Allerede fundne problematiske ingredienser: ${fundne.length > 0 ? fundne.join(', ') : 'ingen fundet med simpel søgning'}

Tjek grundigt for: gluten (hvede, rug, byg, spelt, havre, malt), mælkeprodukter (mælk, smør, fløde, ost, valle, kasein, laktose), soja, og skjulte E-numre der kan indeholde gluten.

Svar KUN med dette JSON-format:
{
  "sikker": true/false,
  "advarsler": ["advarsel 1", "advarsel 2"],
  "skjulte_risici": ["risiko 1"],
  "forklaring": "Kort forklaring til et barn på 10 år",
  "karakter": "OK" / "ADVARSEL" / "STOP"
}`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: claudePrompt }]
      })
    });

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content?.[0]?.text || '{}';
    const analyse = JSON.parse(rawText.replace(/```json|```/g, '').trim());

    return res.status(200).json({
      found: true,
      produktNavn,
      ingredienser,
      kilde,
      fundneForbudte: fundne,
      analyse
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
