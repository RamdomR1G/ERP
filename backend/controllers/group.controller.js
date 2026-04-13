const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

exports.getGroups = async (req, res) => {
    try {
        const { data: groups, error } = await supabase.from('groups').select('*');
        if (error) throw error;
        
        // Manual count to bypass Supabase FK relation errors
        const { data: users, error: userError } = await supabase.from('users').select('group_ids');
        
        let groupsWithCount = groups;
        if (!userError && users) {
            groupsWithCount = groups.map(g => {
                const membersCount = users.filter(u => Array.isArray(u.group_ids) && u.group_ids.includes(g.id)).length;
                return { ...g, members: membersCount };
            });
        }

        res.json(groupsWithCount);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('groups').select('*').eq('id', id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Not found' });
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createGroup = async (req, res) => {
    try {
        console.log('[GroupController] Creating group:', req.body);
        const { data, error } = await supabase.from('groups').insert([req.body]).select('id').single();
        if (error) {
            console.error('[GroupController] Create Error:', error);
            throw error;
        }
        res.status(201).json({ message: 'Created', id: data.id });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[GroupController] Updating group ${id}:`, req.body);
        const { data, error } = await supabase.from('groups').update(req.body).eq('id', id).select('id');
        
        if (error) {
            console.error('[GroupController] Update Error:', error);
            throw error;
        }
        
        if (!data || data.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Updated' });
    } catch (err) { 
        console.error('[GroupController] 500 Error:', err.message);
        res.status(500).json({ error: err.message }); 
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('groups').delete().eq('id', id).select('id');
        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
