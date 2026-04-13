const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fastify = require('fastify')({ logger: true, ignoreTrailingSlash: true });
const cors = require('@fastify/cors');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

fastify.register(cors);

// ROUTES (Redundant roots to handle Gateway variations)
const getGroupsHandler = async (request, reply) => {
    const user_id = request.headers['x-user-id'];
    const role = request.headers['x-user-role'];

    if (!user_id || !role) return reply.status(401).send({ error: 'Identity headers missing' });

    let query = supabase.from('groups').select('*');

    // ISOLATION: If not Admin, filter by user allowed group_ids
    if (role !== 'Admin') {
        const { data: user } = await supabase.from('users').select('group_ids').eq('id', user_id).single();
        if (user && Array.isArray(user.group_ids) && user.group_ids.length > 0) {
            query = query.in('id', user.group_ids);
        } else {
            // NO GROUPS ASSIGNED -> SHUTDOWN DATA
            return { statusCode: 200, intOpCode: 'SxGR200', data: [] }; 
        }
    }

    const { data: groups, error } = await query;
    if (error) return reply.status(500).send({ statusCode: 500, intOpCode: 'SxGR500', data: null, error: error.message });

    // Calculate members count for the groups we're returning
    const { data: users, error: userError } = await supabase.from('users').select('group_ids');
    
    if (!userError && users) {
        const result = groups.map(g => {
            const membersCount = users.filter(u => Array.isArray(u.group_ids) && u.group_ids.includes(g.id)).length;
            return { ...g, members: membersCount };
        });
        return { statusCode: 200, intOpCode: 'SxGR200', data: result };
    }
    return { statusCode: 200, intOpCode: 'SxGR200', data: groups };
};

// Handle both root and /groups
fastify.get('/', getGroupsHandler);
fastify.get('/groups', getGroupsHandler);

// GET Group by ID (redundant)
const getGroupByIdHandler = async (request, reply) => {
    const { id } = request.params;
    const { data, error } = await supabase.from('groups').select('*').eq('id', id).single();
    if (error) return reply.status(404).send({ statusCode: 404, intOpCode: 'SxGR404', data: null, error: 'Group not found' });
    return { statusCode: 200, intOpCode: 'SxGR200', data };
};
fastify.get('/:id', getGroupByIdHandler);
fastify.get('/groups/:id', getGroupByIdHandler);

// POST Group
const postGroupHandler = async (request, reply) => {
    const { data, error } = await supabase.from('groups').insert([request.body]).select('id').single();
    if (error) return reply.status(500).send({ statusCode: 500, intOpCode: 'SxGR500', data: null, error: error.message });
    return reply.status(201).send({ statusCode: 201, intOpCode: 'SxGR201', data: { message: 'Created', id: data.id } });
};
fastify.post('/', postGroupHandler);
fastify.post('/groups', postGroupHandler);

// PUT Group
const putGroupHandler = async (request, reply) => {
    const { id } = request.params;
    const { error } = await supabase.from('groups').update(request.body).eq('id', id);
    if (error) return reply.status(500).send({ statusCode: 500, intOpCode: 'SxGR500', data: null, error: error.message });
    return { statusCode: 200, intOpCode: 'SxGR200', data: { message: 'Updated' } };
};
fastify.put('/:id', putGroupHandler);
fastify.put('/groups/:id', putGroupHandler);

// DELETE Group
const deleteGroupHandler = async (request, reply) => {
    return { statusCode: 200, intOpCode: 'SxGR200', data: { message: 'Deleted' } };
};
fastify.delete('/:id', deleteGroupHandler);
fastify.delete('/groups/:id', deleteGroupHandler);

// Permissions
const getPermsHandler = async (request, reply) => {
    const { data, error } = await supabase.from('permissions').select('*').order('category', { ascending: true });
    if (error) return reply.status(500).send({ statusCode: 500, intOpCode: 'SxGR500', data: null, error: error.message });
    return { statusCode: 200, intOpCode: 'SxGR200', data };
};
fastify.get('/permissions', getPermsHandler);
fastify.get('/groups/permissions', getPermsHandler);

const start = async () => {
    try {
        await fastify.listen({ port: 3003, host: '0.0.0.0' });
        console.log('Groups Service running on port 3003');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
