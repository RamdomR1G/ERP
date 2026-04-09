require('dotenv').config({ path: '../../.env' });
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

fastify.register(cors);

// Get Groups (with members count and isolation)
fastify.get('/', async (request, reply) => {
    const { user_id, role } = request.query;
    let query = supabase.from('groups').select('*');

    // ISOLATION: If not Admin, filter by user allowed group_ids
    if (role !== 'Admin' && user_id) {
        const { data: user } = await supabase.from('users').select('group_ids').eq('id', user_id).single();
        if (user && Array.isArray(user.group_ids)) {
            query = query.in('id', user.group_ids);
        } else {
            return []; // No groups if no access
        }
    }

    const { data: groups, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });

    // Calculate members count for the groups we're returning
    const { data: users, error: userError } = await supabase.from('users').select('group_ids');
    
    if (!userError && users) {
        return groups.map(g => {
            const membersCount = users.filter(u => Array.isArray(u.group_ids) && u.group_ids.includes(g.id)).length;
            return { ...g, members: membersCount };
        });
    }
    return groups;
});

// Get Group by ID
fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    const { data, error } = await supabase.from('groups').select('*').eq('id', id).single();
    if (error) return reply.status(404).send({ error: 'Group not found' });
    return data;
});

// Create Group
fastify.post('/', async (request, reply) => {
    const { data, error } = await supabase.from('groups').insert([request.body]).select('id').single();
    if (error) return reply.status(500).send({ error: error.message });
    return { message: 'Created', id: data.id };
});

// Update Group
fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    const { data, error } = await supabase.from('groups').update(request.body).eq('id', id).select('id');
    if (error) return reply.status(500).send({ error: error.message });
    return { message: 'Updated' };
});

// Delete Group
fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;
    return { message: 'Deleted' };
});

// Permissions logic (Migrated here)
fastify.get('/permissions', async (request, reply) => {
    const { data, error } = await supabase.from('permissions').select('*').order('category', { ascending: true });
    if (error) return reply.status(500).send({ error: error.message });
    return data;
});

const start = async () => {
    try {
        await fastify.listen({ port: 3002, host: '0.0.0.0' });
        console.log('Groups Service running on port 3002');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
