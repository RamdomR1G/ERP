const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

exports.getPermissions = async (req, res) => {
    try {
        const { data, error } = await supabase.from('permissions').select('*').order('category', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createPermission = async (req, res) => {
    try {
        const { data, error } = await supabase.from('permissions').insert([req.body]).select('id').single();
        if (error) throw error;
        res.status(201).json({ message: 'Created', id: data.id });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
