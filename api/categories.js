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
          .from('categories')
          .select('*')
          .eq('category_id', id)
          .single();
        if (error) throw error;
        return res.status(200).json(data);
      } else {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('category_id');
        if (error) throw error;
        return res.status(200).json(data);
      }
    }
    else if (method === 'POST') {
      const { data: existing } = await supabase
        .from('categories')
        .select('category_id')
        .order('category_id', { ascending: false })
        .limit(1);
      const newId = (existing && existing[0]?.category_id || 0) + 1;
      const newCategory = {
        category_id: newId,
        category_name: body.category_name,
        parent_id: body.parent_id || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('categories').insert(newCategory).select();
      if (error) throw error;
      return res.status(201).json(data[0]);
    }
    else if (method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const updates = { ...body, updated_at: new Date().toISOString() };
      delete updates.category_id;
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('category_id', id)
        .select();
      if (error) throw error;
      return res.status(200).json(data[0]);
    }
    else if (method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const { error } = await supabase.from('categories').delete().eq('category_id', id);
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