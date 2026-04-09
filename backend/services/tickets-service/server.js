require('dotenv').config({ path: '../../.env' });
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

fastify.register(cors);

// Get Tickets
fastify.get('/', async (request, reply) => {
    const { group_id, assigned_to } = request.query;
    let query = supabase.from('tickets').select('*, assigned_user:users!assigned_to(name), creator:users!created_by(name)');
    
    if (group_id) query = query.eq('group_id', group_id);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);

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

// Update Ticket
fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    const { error } = await supabase.from('tickets').update(request.body).eq('id', id);
    if (error) return reply.status(500).send({ error: error.message });
    return { message: 'Updated' };
});

// Delete Ticket
fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;
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
