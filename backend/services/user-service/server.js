require('dotenv').config({ path: '../../.env' });
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

fastify.register(cors);

// Login
fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) return reply.status(401).send({ error: 'Credenciales inválidas' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return reply.status(401).send({ error: 'Credenciales inválidas' });

    delete user.password_hash;
    return { message: 'Autenticación exitosa', user };
});

// Create User
fastify.post('/', async (request, reply) => {
    const payload = request.body;
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(payload.password, salt);

    const { data, error } = await supabase
        .from('users')
        .insert([{
            name: payload.name,
            email: payload.email,
            password_hash: password_hash,
            role: payload.role,
            group_ids: payload.group_ids,
            status: payload.status || 'Active',
            permissions: payload.permissions || []
        }])
        .select('id')
        .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send({ message: 'Usuario creado exitosamente', id: data.id });
});

// Get Users
fastify.get('/', async (request, reply) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, group_ids, status, joined_date, permissions');
    if (error) return reply.status(500).send({ error: error.message });
    return data;
});

// Get User by ID
fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, group_ids, status, joined_date, permissions')
        .eq('id', id)
        .single();
    if (error) return reply.status(404).send({ error: 'Usuario no encontrado' });
    return data;
});

// Update User
fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    const updates = { ...request.body };

    if (updates.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password_hash = await bcrypt.hash(updates.password, salt);
        delete updates.password;
    }

    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id');

    if (error) return reply.status(500).send({ error: error.message });
    return { message: 'Usuario actualizado exitosamente' };
});

// Delete User
fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;
    
    // Deletion check (active tickets)
    const { data: tickets } = await supabase
        .from('tickets')
        .select('id')
        .eq('assigned_to', id)
        .neq('status', 'Done');

    if (tickets && tickets.length > 0) {
        return reply.status(400).send({ error: 'User has active tickets' });
    }

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return reply.status(500).send({ error: error.message });
    return { message: 'Usuario eliminado' };
});

const start = async () => {
    try {
        await fastify.listen({ port: 3001, host: '0.0.0.0' });
        console.log('User Service running on port 3001');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
