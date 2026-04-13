const fastify = require('fastify')({ logger: true });
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const proxy = require('@fastify/http-proxy');
const jwt = require('@fastify/jwt');
const cors = require('@fastify/cors');

// REGISTROS
fastify.register(cors, {
    origin: '*', // Permitir peticiones desde el Angular (4200)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-group-id']
});
fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'secret-key'
});

// CONFIGURACION DE PERMISOS REQUERIDOS POR RUTA
const PERMISSION_MAP = {
    'POST:/api/tickets': 'ticket:add',
    'PUT:/api/tickets': 'ticket:edit',
    'PATCH:/api/tickets': 'ticket:edit_state',
    'DELETE:/api/tickets': 'ticket:delete',
    'POST:/api/groups': 'group:add',
    'PUT:/api/groups': 'group:edit',
    'PATCH:/api/groups': 'group:edit',
    'DELETE:/api/groups': 'group:delete',
    'POST:/api/users': 'user:add',
    'PUT:/api/users': 'user:edit',
    'DELETE:/api/users': 'user:delete',
};

// MIDDLEWARE DE SEGURIDAD (Hook)
fastify.addHook('onRequest', async (request, reply) => {
    const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/health'];
    if (publicPaths.includes(request.url)) return;

    try {
        const decoded = await request.jwtVerify();
        
        // VALIDACION DE PERMISOS (PBAC)
        const method = request.method;
        const path = request.url.split('?')[0];
        const routeKey = `${method}:${path}`;
        const requiredPerm = PERMISSION_MAP[routeKey];

        if (requiredPerm) {
            // Extraer groupId del header o query para validación contextual
            const groupId = request.headers['x-group-id'] || request.query.groupId;
            
            // 1. Si es Admin real, ignorar contexto de grupo para estas rutas globales
            if (decoded.role === 'Admin') {
                // Permitido
            } 
            // 2. Si no es Admin, requiere contexto de grupo obligatoriamente
            else if (!groupId) {
                return reply.code(400).send({ error: 'Falta contexto de grupo (x-group-id)' });
            } 
            // 3. Validar permisos dentro del grupo
            else {
                const userPerms = decoded.group_permissions[groupId] || [];
                if (!userPerms.includes(requiredPerm) && !userPerms.includes('*')) {
                    return reply.code(403).send({ error: 'Prohibido', message: `No tienes permiso: ${requiredPerm}` });
                }
            }
        }
    } catch (err) {
        reply.code(401).send({ error: 'No autorizado', message: 'Token inválido o expirado' });
    }
});

// PROXY POR SERVICIO (Map /api/X to /X on microservices)
// USER SERVICE (Auth & Users) - Port 3001
fastify.register(proxy, {
    upstream: 'http://localhost:3001',
    prefix: '/api/auth',
    rewritePrefix: '/auth'
});

fastify.register(proxy, {
    upstream: 'http://localhost:3001',
    prefix: '/api/users',
    rewritePrefix: '/users'
});

// TICKETS SERVICE - Port 3002
fastify.register(proxy, {
    upstream: 'http://localhost:3002',
    prefix: '/api/tickets',
    rewritePrefix: '/tickets'
});

// GROUPS/WORKSPACES SERVICE - Port 3003
fastify.register(proxy, {
    upstream: 'http://localhost:3003',
    prefix: '/api/groups',
    rewritePrefix: '/groups'
});

// HEALTH CHECK
fastify.get('/api/health', async () => ({ status: 'Gateway OK', microservices: 'Readying...' }));

// NOT FOUND HANDLER (Debug routing)
fastify.setNotFoundHandler((request, reply) => {
    console.warn(`[Gateway] 404 Route Not Found: ${request.method} ${request.url}`);
    reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `Route ${request.method}:${request.url} not found in Gateway`
    });
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
