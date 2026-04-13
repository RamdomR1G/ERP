const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fastify = require('fastify')({ logger: true, ignoreTrailingSlash: true });
const cors = require('@fastify/cors');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

fastify.register(cors);

// TICKETS CRUD (Safe-routing versions)
const getTicketsHandler = async (request, reply) => {
    const { group_id } = request.query;
    const user_id = request.headers['x-user-id'];
    const role = request.headers['x-user-role'];
    const userGroupsString = request.headers['x-user-groups'] || '[]';

    if (!user_id || !role) return reply.status(401).send({ error: 'Identity headers missing' });

    let query = supabase.from('tickets').select('*, assigned_user:users!assigned_to(name), creator:users!created_by(name)');
    
    // SECURITY & CONTEXT LOGIC
    if (role === 'Admin') {
        // Admins can see everything, but respect context if provided
        if (group_id) query = query.eq('group_id', group_id);
    } 
    else {
        let userGroups = [];
        try { userGroups = JSON.parse(userGroupsString); } catch (e) {}

        if (group_id) {
            // CONTEXTUAL VIEW (Dashboard)
            // If they belong to the group, show all group tickets. 
            // If not, only show if they are author/assignee within that group.
            if (userGroups.includes(group_id)) {
                query = query.eq('group_id', group_id);
            } else {
                query = query.eq('group_id', group_id).or(`assigned_to.eq.${user_id},created_by.eq.${user_id}`);
            }
        } else {
            // GLOBAL VIEW
            if (userGroups.length > 0) {
                query = query.or(`group_id.in.(${userGroups.join(',')}),assigned_to.eq.${user_id},created_by.eq.${user_id}`);
            } else {
                query = query.or(`assigned_to.eq.${user_id},created_by.eq.${user_id}`);
            }
        }
    }
    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });
    return { statusCode: 200, data };
};
fastify.get('/', getTicketsHandler);
fastify.get('/tickets', getTicketsHandler);

const getTicketByIdHandler = async (request, reply) => {
    const { data, error } = await supabase.from('tickets').select('*, assigned_user:users!assigned_to(name), creator:users!created_by(name)').eq('id', request.params.id).single();
    if (error) return reply.status(404).send({ error: 'Not found' });
    return { statusCode: 200, data };
};
fastify.get('/:id', getTicketByIdHandler);
fastify.get('/tickets/:id', getTicketByIdHandler);

const postTicketHandler = async (request, reply) => {
    const { data, error } = await supabase.from('tickets').insert([request.body]).select('id').single();
    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send({ statusCode: 201, data });
};
fastify.post('/', postTicketHandler);
fastify.post('/tickets', postTicketHandler);

const putTicketHandler = async (request, reply) => {
    const { id } = request.params;
    const user_id = request.headers['x-user-id'];
    const role = request.headers['x-user-role'];
    const updates = request.body;
    if (role !== 'Admin' && user_id) {
        const { data: ticket } = await supabase.from('tickets').select('assigned_to, created_by').eq('id', id).single();
        if (ticket && (ticket.assigned_to !== user_id && ticket.created_by !== user_id)) {
            return reply.status(403).send({ error: 'Solo puedes editar tus propios tickets' });
        }
    }
    const { error } = await supabase.from('tickets').update(updates).eq('id', id);
    if (error) return reply.status(500).send({ error: error.message });
    return { statusCode: 200, data: { message: 'Updated' } };
};
fastify.put('/:id', putTicketHandler);
fastify.put('/tickets/:id', putTicketHandler);

const patchStatusHandler = async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body;
    const { error } = await supabase.from('tickets').update({ status }).eq('id', id);
    if (error) return reply.status(500).send({ error: error.message });
    return { statusCode: 200, data: { message: 'Updated' } };
};
fastify.patch('/:id/status', patchStatusHandler);
fastify.patch('/tickets/:id/status', patchStatusHandler);

const start = async () => {
    try {
        await fastify.listen({ port: 3002, host: '0.0.0.0' });
        console.log('Tickets Service running on port 3002');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
