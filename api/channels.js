import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { method, query, body } = req;
    const id = query.id;

    try {
        if (method === 'GET') {
            if (id) {
                const { data, error } = await supabase.from('channels').select('*').eq('channel_id', id).single();
                if (error) throw error;
                return res.status(200).json(data);
            } else {
                const { data, error } = await supabase.from('channels').select('*').order('channel_id');
                if (error) throw error;
                return res.status(200).json(data);
            }
        }
        else if (method === 'POST') {
            // auto-generate new channel_id (max+1)
            const { data: existing } = await supabase.from('channels').select('channel_id').order('channel_id', { ascending: false }).limit(1);
            const newId = (existing && existing[0]?.channel_id || 0) + 1;
            const newChannel = { ...body, channel_id: newId };
            const { data, error } = await supabase.from('channels').insert(newChannel).select();
            if (error) throw error;
            return res.status(201).json(data[0]);
        }
        else if (method === 'PUT') {
            if (!id) return res.status(400).json({ error: 'Missing id' });
            const { data, error } = await supabase.from('channels').update(body).eq('channel_id', id).select();
            if (error) throw error;
            return res.status(200).json(data[0]);
        }
        else if (method === 'DELETE') {
            if (!id) return res.status(400).json({ error: 'Missing id' });
            const { error } = await supabase.from('channels').delete().eq('channel_id', id);
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
