export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_ANON_KEY;

  async function sbFetch(path, method = 'GET', body = null) {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Prefer': method === 'POST' ? 'return=representation' : ''
      }
    };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(SB_URL + '/rest/v1' + path, opts);
    if (!r.ok) {
      const err = await r.text();
      throw new Error('Supabase fejl ' + r.status + ': ' + err);
    }
    const txt = await r.text();
    return txt ? JSON.parse(txt) : null;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { handling, familie_id } = body;

    if (req.method === 'GET') {
      const fid = req.query?.familie_id;
      const data = await sbFetch(`/produkter?familie_id=eq.${fid}&order=created_at.desc`);
      return res.status(200).json(data || []);
    }

    if (handling === 'gem_produkt') {
      const { produkt } = body;
      // Upsert baseret paa familie_id + navn
      const data = await sbFetch('/produkter?on_conflict=familie_id,navn', 'POST', {
        familie_id,
        barcode: produkt.barcode || null,
        navn: produkt.navn || 'Ukendt',
        ingredienser: produkt.ingredienser || '',
        enumre: produkt.enumre || [],
        analyse_data: produkt.analyse || {},
        markering: 'ingen',
        sidst_scannet: new Date().toISOString()
      });
      return res.status(200).json(Array.isArray(data) ? data[0] : data);
    }

    if (handling === 'opdater_markering') {
      const { produkt_id, markering } = body;
      const data = await sbFetch(
        `/produkter?id=eq.${produkt_id}`,
        'PATCH',
        { markering, har_reaktion: markering !== 'ingen' }
      );
      return res.status(200).json(Array.isArray(data) ? data[0] : {ok: true});
    }

    if (handling === 'registrer_reaktion') {
      const { produkt_id, reaktion } = body;
      await sbFetch('/reaktioner', 'POST', {
        familie_id, produkt_id,
        dato: new Date().toISOString(),
        symptomer: reaktion.symptomer,
        alvorlighed: reaktion.alvorlighed
      });
      await sbFetch(`/produkter?id=eq.${produkt_id}`, 'PATCH', { har_reaktion: true, markering: 'gul' });
      return res.status(200).json({ ok: true });
    }

    if (handling === 'find_sammenfald') {
      const rp = await sbFetch(`/produkter?familie_id=eq.${familie_id}&markering=in.(roed,gul)`);
      if (!rp || rp.length === 0) {
        return res.status(200).json({ produkter: [], sammenfald: { sammenfald:[], mulige_syndere:[], anbefaling:'Ingen markerede produkter endnu.' }});
      }
      const liste = rp.map(p => `${p.navn}: ${p.ingredienser}`).join('\n');
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600,
          messages: [{ role: 'user', content: `Find faelles ingredienser i disse reaktionsprodukter. Svar KUN med JSON:\n{"sammenfald":["ing"],"mulige_syndere":["forklaring"],"anbefaling":"raadet"}\n\n${liste}` }]
        })
      });
      const cd = await apiRes.json();
      const raw = (cd.content?.[0]?.text || '{}').trim();
      let sam = null;
      try { sam = JSON.parse(raw); } catch(e) {}
      if (!sam) { try { const m = raw.match(/\{[\s\S]*\}/); if(m) sam = JSON.parse(m[0]); } catch(e) {} }
      if (!sam) sam = { sammenfald:[], mulige_syndere:[], anbefaling:'Analyse fejlede' };
      return res.status(200).json({ produkter: rp, sammenfald: sam });
    }

    return res.status(400).json({ error: 'Ukendt handling: ' + handling });
  } catch(e) {
    console.error('produkter fejl:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
