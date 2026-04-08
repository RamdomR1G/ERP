const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

exports.getTickets = async (req, res) => {
    try {
        const { group_id } = req.query;
        let query = supabase.from('tickets').select('*, assigned_user:users!assigned_to(name), creator:users!created_by(name)');
        
        if (group_id) {
            query = query.eq('group_id', group_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('tickets').select('*, assigned_user:users!assigned_to(name), creator:users!created_by(name)').eq('id', id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Not found' });
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createTicket = async (req, res) => {
    try {
        const { data, error } = await supabase.from('tickets').insert([req.body]).select('id').single();
        if (error) throw error;
        res.status(201).json({ message: 'Created', id: data.id });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('tickets').update(req.body).eq('id', id).select('id');
        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('tickets').delete().eq('id', id).select('id');
        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
