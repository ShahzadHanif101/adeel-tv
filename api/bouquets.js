import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { method, query, body } = req;
  const id = query.id;

  try {
    if (method === 'GET') {
      if (id) {
        const { data, error } = await supabase
          .from('bouquets')
          .select('*')
          .eq('bouquet_id', id)
          .single();
        if (error) throw error;
        return res.status(200).json(data);
      } else {
        const { data, error } = await supabase
          .from('bouquets')
          .select('*')
          .order('bouquet_id');
        if (error) throw error;
        return res.status(200).json(data);
      }
    }
    else if (method === 'POST') {
      const { data: existing } = await supabase
        .from('bouquets')
        .select('bouquet_id')
        .order('bouquet_id', { ascending: false })
        .limit(1);
      const newId = (existing && existing[0]?.bouquet_id || 0) + 1;
      const newBouquet = {
        bouquet_id: newId,
        bouquet_name: body.bouquet_name,
        days: body.days,
        max_streams: body.max_streams || 1,
        price: body.price || 0.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('bouquets').insert(newBouquet).select();
      if (error) throw error;
      return res.status(201).json(data[0]);
    }
    else if (method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const updates = { ...body, updated_at: new Date().toISOString() };
      delete updates.bouquet_id;
      const { data, error } = await supabase
        .from('bouquets')
        .update(updates)
        .eq('bouquet_id', id)
        .select();
      if (error) throw error;
      return res.status(200).json(data[0]);
    }
    else if (method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'Missing id' });
      // Optionally: check if any users are using this bouquet (set NULL)
      await supabase.from('users').update({ bouquet_id: null }).eq('bouquet_id', id);
      const { error } = await supabase.from('bouquets').delete().eq('bouquet_id', id);
      if (error) throw error;
      return res.status(204).end();
    }
    else {
      res.setHeader('Allow', ['GET','POST','PUT','DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}