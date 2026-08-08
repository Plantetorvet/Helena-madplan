import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { handling, familie_id } = body;

    if (req.method === 'GET') {
      const fid = req.query?.familie_id;
      const { data, error } = await sb.from('produkter').select('*').eq('familie_id', fid).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (handling === 'gem_produkt') {
      const { produkt } = body;
      const { data, error } = await sb.from('produkter').upsert({
        familie_id, barcode: produkt.barcode||null, navn: produkt.navn||'Ukendt',
        ingredienser: produkt.ingredienser||'', enumre: produkt.enumre||[],
        analyse_data: produkt.analyse||{}, markering: 'ingen',
        sidst_scannet: new Date().toISOString()
      }, { onConflict: 'familie_id,navn' }).select();
      if (error) throw error;
      return res.status(200).json(data[0]);
    }

    if (handling === 'opdater_markering') {
      const { produkt_id, markering } = body;
      const { data, error } = await sb.from('produkter').update({ markering, har_reaktion: markering !== 'ingen' }).eq('id', produkt_id).select();
      if (error) throw error;
      return res.status(200).json(data[0]);
    }

    if (handling === 'registrer_reaktion') {
      const { produkt_id, reaktion } = body;
      const { error } = await sb.from('reaktioner').insert({ familie_id, produkt_id, dato: new Date().toISOString(), symptomer: reaktion.symptomer, alvorlighed: reaktion.alvorlighed });
      if (error) throw error;
      await sb.from('produkter').update({ har_reaktion: true, markering: 'gul' }).eq('id', produkt_id);
      return res.status(200).json({ ok: true });
    }

    if (handling === 'find_sammenfald') {
      const { data: rp } = await sb.from('produkter').select('*').eq('familie_id', familie_id).in('markering', ['roed','gul']);
      if (!rp || rp.length === 0) return res.status(200).json({ produkter:[], sammenfald:{ sammenfald:[], mulige_syndere:[], anbefaling:'Ingen markerede produkter endnu.' } });
      const liste = rp.map(p=>`${p.navn}: ${p.ingredienser}`).join('\n');
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
        body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:800, messages:[{role:'user',content:`Find fælles ingredienser i disse reaktionsprodukter. Svar KUN med JSON:\n{"sammenfald":["ing"],"mulige_syndere":["forklaring"],"anbefaling":"råd"}\n\n${liste}`}] })
      });
      const cd = await apiRes.json();
      const raw = (cd.content?.[0]?.text||'{}').trim();
      let sam = null;
      try { sam=JSON.parse(raw); } catch(e) {}
      if (!sam) { try { const m=raw.match(/\{[\s\S]*\}/); if(m) sam=JSON.parse(m[0]); } catch(e) {} }
      if (!sam) sam = { sammenfald:[], mulige_syndere:[], anbefaling:'Kunne ikke analysere' };
      return res.status(200).json({ produkter:rp, sammenfald:sam });
    }

    return res.status(400).json({ error: 'Ukendt handling' });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
