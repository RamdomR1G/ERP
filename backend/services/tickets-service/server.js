const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

fastify.register(cors);

// Get Tickets (with isolation)
fastify.get('/', async (request, reply) => {
    const { group_id } = request.query;
    const user_id = request.headers['x-user-id'];
    const role = request.headers['x-user-role'];
    
    let query = supabase.from('tickets').select('*, assigned_user:users!assigned_to(name), creator:users!created_by(name)');
    
    if (group_id) query = query.eq('group_id', group_id);
    
    // ISOLATION: 
    // Admin: Sees everything.
    // Regular User: Sees tickets in their shared groups OR tickets assigned/created by them.
    if (role !== 'Admin') {
        const userGroupsString = request.headers['x-user-groups'] || '[]';
        let userGroups = [];
        try {
            userGroups = JSON.parse(userGroupsString);
        } catch (e) {
            console.error('[TicketsService] Error parsing x-user-groups:', e);
        }

        if (user_id) {
            if (Array.isArray(userGroups) && userGroups.length > 0) {
                // Return tickets from user groups OR owned by user
                query = query.or(`group_id.in.(${userGroups.join(',')}),assigned_to.eq.${user_id},created_by.eq.${user_id}`);
            } else {
                // If no groups, ONLY see owned tickets
                query = query.or(`assigned_to.eq.${user_id},created_by.eq.${user_id}`);
            }
        }
    }

    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });
    return data;
});

// Get Ticket by ID
fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    const { data, error } = await supabase
        .from('tickets')
        .select('*, assigned_user:users!assigned_to(name), creator:users!created_by(name)')
        .eq('id', id)
        .single();
    if (error) return reply.status(404).send({ error: 'Not found' });
    return data;
});

// Create Ticket
fastify.post('/', async (request, reply) => {
    const { data, error } = await supabase.from('tickets').insert([request.body]).select('id').single();
    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send({ message: 'Created', id: data.id });
});

// Update Ticket (with ownership and field restriction)
fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    const user_id = request.headers['x-user-id'];
    const role = request.headers['x-user-role'];
    const updates = request.body;

    // Security Check: If not Admin, must be the owner (assigned_to or creator)
    if (role !== 'Admin' && user_id) {
        const { data: ticket } = await supabase.from('tickets').select('assigned_to, created_by').eq('id', id).single();
        if (ticket && (ticket.assigned_to !== user_id && ticket.created_by !== user_id)) {
            return reply.status(403).send({ error: 'Solo puedes editar tus propios tickets' });
        }

        // Field Validation: ONLY status and comments allowed for non-admins (ticket:move context)
        const allowedFields = ['status', 'comments', 'history'];
        const updateKeys = Object.keys(updates);
        const forbiddenFields = updateKeys.filter(k => !allowedFields.includes(k));
        
        if (forbiddenFields.length > 0) {
            return reply.status(403).send({ error: `No tienes permiso para editar campos críticos: ${forbiddenFields.join(', ')}` });
        }
    }

    const { error } = await supabase.from('tickets').update(updates).eq('id', id);
    if (error) return reply.status(500).send({ error: error.message });
    return { message: 'Updated' };
});

// PATCH /status (Strict Compliance)
fastify.patch('/:id/status', async (request, reply) => {
    const { id } = request.params;
    const user_id = request.headers['x-user-id'];
    const role = request.headers['x-user-role'];
    const { status } = request.body;

    if (!status) return reply.status(400).send({ error: 'Status is required' });

    // Security Check: If not Admin, must be the owner (assigned_to or creator)
    if (role !== 'Admin' && user_id) {
        const { data: ticket } = await supabase.from('tickets').select('assigned_to, created_by').eq('id', id).single();
        if (ticket && (ticket.assigned_to !== user_id && ticket.created_by !== user_id)) {
            return reply.status(403).send({ error: 'Solo puedes mover tickets que tengas asignados' });
        }
    }

    const { error } = await supabase.from('tickets').update({ status }).eq('id', id);
    if (error) return reply.status(500).send({ error: error.message });
    return { message: 'Ticket status updated' };
});

// Delete Ticket (Admin only)
fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;
    const role = request.headers['x-user-role'];

    if (role !== 'Admin') {
        return reply.status(403).send({ error: 'Solo los administradores pueden borrar tickets' });
    }

    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) return reply.status(500).send({ error: error.message });
    return { message: 'Deleted' };
});

const start = async () => {
    try {
        await fastify.listen({ port: 3003, host: '0.0.0.0' });
        console.log('Tickets Service running on port 3003');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
