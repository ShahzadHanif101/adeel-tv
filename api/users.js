import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

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
          .from('users')
          .select('*')
          .eq('user_id', id)
          .single();
        if (error) throw error;
        // remove password from response
        delete data.password;
        return res.status(200).json(data);
      } else {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('user_id');
        if (error) throw error;
        // strip passwords
        const safeData = data.map(u => { delete u.password; return u; });
        return res.status(200).json(safeData);
      }
    }
    else if (method === 'POST') {
      // Generate new user_id
      const { data: existing } = await supabase
        .from('users')
        .select('user_id')
        .order('user_id', { ascending: false })
        .limit(1);
      const newId = (existing && existing[0]?.user_id || 0) + 1;
      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 10);
      const newUser = {
        user_id: newId,
        username: body.username,
        password: hashedPassword,
        email: body.email || null,
        bouquet_id: body.bouquet_id || null,
        expiry_date: body.expiry_date || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        max_connections: body.max_connections || 1,
        status: body.status || 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('users').insert(newUser).select();
      if (error) throw error;
      const created = data[0];
      delete created.password;
      return res.status(201).json(created);
    }
    else if (method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'Missing id' });
      // Build update object, hash password if provided
      const updates = { ...body, updated_at: new Date().toISOString() };
      if (body.password) {
        updates.password = await bcrypt.hash(body.password, 10);
      } else {
        delete updates.password;  // don't overwrite with undefined
      }
      delete updates.user_id; // prevent changing primary key
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', id)
        .select();
      if (error) throw error;
      if (data && data[0]) delete data[0].password;
      return res.status(200).json(data[0]);
    }
    else if (method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const { error } = await supabase.from('users').delete().eq('user_id', id);
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