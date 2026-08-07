import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { handling, familie_id } = body;

  try {
    if (req.method === 'GET') {
      // Hent alle produkter for familien
      const fid = req.query?.familie_id;
      const { data, error } = await supabase
        .from('produkter')
        .select('*')
        .eq('familie_id', fid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (handling === 'gem_produkt') {
      const { produkt } = body;
      const { data, error } = await supabase
        .from('produkter')
        .upsert({
          familie_id,
          barcode: produkt.barcode,
          navn: produkt.navn,
          ingredienser: produkt.ingredienser,
          analyse_data: produkt.analyse,
          sidst_scannet: new Date().toISOString()
        }, { onConflict: 'familie_id,barcode' })
        .select();
      if (error) throw error;
      return res.status(200).json(data[0]);
    }

    if (handling === 'registrer_reaktion') {
      const { produkt_id, reaktion } = body;
      const { data, error } = await supabase
        .from('reaktioner')
        .insert({
          familie_id,
          produkt_id,
          dato: new Date().toISOString(),
          symptomer: reaktion.symptomer,
          alvorlighed: reaktion.alvorlighed,
          noter: reaktion.noter
        })
        .select();
      if (error) throw error;

      // Marker produktet som reaktion
      await supabase.from('produkter').update({ har_reaktion: true }).eq('id', produkt_id);

      return res.status(200).json(data[0]);
    }

    if (handling === 'find_sammenfald') {
      // Hent alle produkter med reaktioner og find fælles ingredienser
      const { data: reaktionsProdukter, error } = await supabase
        .from('produkter')
        .select('*, reaktioner(*)')
        .eq('familie_id', familie_id)
        .eq('har_reaktion', true);
      if (error) throw error;

      // Analyser sammenfald med Claude
      const produktListe = reaktionsProdukter.map(p => `${p.navn}: ${p.ingredienser}`).join('\n');
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          messages: [{ role: 'user', content: `Analyser disse produkter der alle har givet reaktion. Find hvilke ingredienser de har til fælles. Svar KUN med JSON:
{"sammenfald": ["ingrediens1","ingrediens2"], "mulige_syndere": ["ingrediens med forklaring"], "anbefaling": "Kort råd"}

Produkter med reaktioner:
${produktListe}` }]
        })
      });
      const cd = await claudeRes.json();
      const analyse = JSON.parse((cd.content?.[0]?.text || '{}').replace(/```json|```/g, '').trim());
      return res.status(200).json({ produkter: reaktionsProdukter, sammenfald: analyse });
    }

    return res.status(400).json({ error: 'Ukendt handling' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
