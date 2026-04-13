const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fastify = require('fastify')({ logger: true, ignoreTrailingSlash: true });
const cors = require('@fastify/cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

fastify.register(cors);

// AUTH ROUTES (Safe-routing versions)
const loginHandler = async (request, reply) => {
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

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, group_permissions: user.group_permissions }, 
        (process.env.JWT_SECRET || 'fallback_secret_not_recommended').trim(), 
        { expiresIn: '8h' }
    );

    return { statusCode: 200, intOpCode: 'SxUS200', data: { message: 'Autenticación exitosa', token, user } };
};

fastify.post('/login', loginHandler);
fastify.post('/auth/login', loginHandler);

const registerHandler = async (request, reply) => {
    const { name, email, password } = request.body;
    if (!name || !email || !password) return reply.status(400).send({ error: 'Campos obligatorios' });
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const { data, error } = await supabase.from('users').insert([{ name, email, password_hash, role: 'User', status: 'Active', permissions: [] }]).select('id').single();
    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send({ statusCode: 201, data: { id: data.id } });
};

fastify.post('/register', registerHandler);
fastify.post('/auth/register', registerHandler);

// USERS CRUD (Safe-routing versions)
const getUsersHandler = async (request, reply) => {
    const user_id = request.headers['x-user-id'];
    const role = request.headers['x-user-role'];
    let query = supabase.from('users').select('id, name, email, role, group_ids, group_permissions, status, joined_date, permissions');
    if (role !== 'Admin' && user_id) {
        const { data: currentUser } = await supabase.from('users').select('group_ids').eq('id', user_id).single();
        if (currentUser && Array.isArray(currentUser.group_ids) && currentUser.group_ids.length > 0) {
             query = query.ov('group_ids', currentUser.group_ids);
        } else {
             query = query.eq('id', user_id);
        }
    }
    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });
    return { statusCode: 200, data };
};

fastify.get('/', getUsersHandler);
fastify.get('/users', getUsersHandler);

const postUserHandler = async (request, reply) => {
    const payload = request.body;
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(payload.password, salt);
    const { data, error } = await supabase.from('users').insert([{ ...payload, password_hash, permissions: payload.permissions || [] }]).select('id').single();
    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send({ statusCode: 201, data: { id: data.id } });
};
fastify.post('/users', postUserHandler);

const getUserByIdHandler = async (request, reply) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', request.params.id).single();
    if (error) return reply.status(404).send({ error: 'User not found' });
    return { statusCode: 200, data };
};
fastify.get('/:id', getUserByIdHandler);
fastify.get('/users/:id', getUserByIdHandler);

const putUserHandler = async (request, reply) => {
    const updates = { ...request.body };
    if (updates.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password_hash = await bcrypt.hash(updates.password, salt);
        delete updates.password;
    }
    const { error } = await supabase.from('users').update(updates).eq('id', request.params.id);
    if (error) return reply.status(500).send({ error: error.message });
    return { statusCode: 200, data: { message: 'Updated' } };
};
fastify.put('/:id', putUserHandler);
fastify.put('/users/:id', putUserHandler);

const deleteUserHandler = async (request, reply) => {
    const { error } = await supabase.from('users').delete().eq('id', request.params.id);
    if (error) return reply.status(500).send({ error: error.message });
    return { statusCode: 200, data: { message: 'Deleted' } };
};
fastify.delete('/:id', deleteUserHandler);
fastify.delete('/users/:id', deleteUserHandler);

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
