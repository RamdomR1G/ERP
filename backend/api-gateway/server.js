require('dotenv').config({ path: '../.env' });
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const replyFrom = require('@fastify/reply-from');

// Service URLs (Internal Ports)
const SERVICES = {
    user: 'http://localhost:3001',
    groups: 'http://localhost:3002',
    tickets: 'http://localhost:3003'
};

fastify.register(cors);
fastify.register(replyFrom);

// Health Check
fastify.get('/health', async () => ({ status: 'Gateway OK' }));

// --- ROUTING ---

// User Service Proxies
fastify.all('/api/users', (request, reply) => {
    reply.from(`${SERVICES.user}/`);
});

fastify.all('/api/users/*', (request, reply) => {
    // Remove prefix /api/users
    const destPath = request.url.replace('/api/users', '');
    reply.from(`${SERVICES.user}${destPath}`);
});

// Groups Service Proxies
fastify.all('/api/groups', (request, reply) => {
    reply.from(`${SERVICES.groups}/`);
});

fastify.all('/api/groups/*', (request, reply) => {
    const destPath = request.url.replace('/api/groups', '');
    reply.from(`${SERVICES.groups}${destPath}`);
});

// Tickets Service Proxies
fastify.all('/api/tickets', (request, reply) => {
    reply.from(`${SERVICES.tickets}/`);
});

fastify.all('/api/tickets/*', (request, reply) => {
    const destPath = request.url.replace('/api/tickets', '');
    reply.from(`${SERVICES.tickets}${destPath}`);
});

// Permissions (Part of Groups or separate? Currently groups)
fastify.all('/api/permissions', (request, reply) => {
    // Forward to groups service if that's where we want it
    reply.from(`${SERVICES.groups}/permissions`);
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('API Gateway running on port 3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
