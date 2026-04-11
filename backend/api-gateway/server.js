const path = require('path');
const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });
console.log(`[Gateway] Intentando cargar .env desde: ${envPath}`);
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const replyFrom = require('@fastify/reply-from');
const jwt = require('jsonwebtoken');

const SERVICES = {
    user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    groups: process.env.GROUPS_SERVICE_URL || 'http://localhost:3002',
    tickets: process.env.TICKETS_SERVICE_URL || 'http://localhost:3003'
};

fastify.register(cors);
fastify.register(replyFrom);

// --- SECURITY MIDDLEWARE ---
const PERMISSION_MAP = [
    { method: 'POST',  path: '/api/tickets',           perm: 'ticket:add' },
    { method: 'GET',   path: '/api/tickets',           perm: 'ticket:view' }, 
    { method: 'PUT',   path: '/api/tickets/*',         perm: 'ticket:edit' },
    { method: 'PATCH', path: '/api/tickets/*/status',  perm: 'ticket:move' },
    { method: 'PATCH', path: '/api/tickets/*',         perm: 'ticket:edit' },
    { method: 'DELETE',path: '/api/tickets/*',         perm: 'ticket:delete' },
    { method: 'GET',   path: '/api/users/*',    perm: 'users:view' },
    { method: 'POST',  path: '/api/users',      perm: 'user:add' },
    { method: 'PUT',   path: '/api/users/*',    perm: 'user:edit' },
    { method: 'DELETE',path: '/api/users/*',    perm: 'user:delete' },
    { method: 'GET',   path: '/api/groups',     perm: 'group:view' },
    { method: 'GET',   path: '/api/groups/*',   perm: 'group:view' },
    { method: 'POST',  path: '/api/groups',     perm: 'group:add' },
];

fastify.addHook('onRequest', async (request, reply) => {
    // 1. Exclude public routes
    const publicRoutes = ['/api/users/login', '/api/users/register', '/health', '/favicon.ico'];
    if (publicRoutes.some(route => request.url.startsWith(route))) return;

    // 2. Validate JWT
    const authHeader = request.headers.authorization;
    console.log(`[Gateway] REQ: ${request.method} ${request.url} | Auth Header: ${authHeader ? 'Presente' : 'AUSENTE'}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[Gateway] ❌ No se proporcionó Token o formato incorrecto');
        return reply.status(401).send({ 
            statusCode: 401, 
            intOpCode: 'SxGW401', 
            data: null, 
            error: 'Acceso Denegado: No se proporcionó Token' 
        });
    }

    const token = authHeader.split(' ')[1];
    try {
        const secret = (process.env.JWT_SECRET || 'fallback_secret_not_recommended').trim();
        const decoded = jwt.verify(token, secret);
        request.user = decoded; 
        console.log(`[Gateway] ✅ Token válido para: ${decoded.email}`);
    } catch (err) {
        console.error('[Gateway] ❌ ERROR DE JWT:', err.message);
        return reply.status(401).send({ 
            statusCode: 401,
            intOpCode: 'SxGW401',
            data: null,
            error: 'Token Inválido o Expirado', 
            details: err.message,
            hint: 'Verifica que el JWT_SECRET sea idéntico en todos los servicios y reinicia el backend.'
        });
    }

    // 3. PBAC - Verify Permissions
    const matchedRule = PERMISSION_MAP.find(rule => {
        const routePath = request.url.split('?')[0];
        if (rule.method !== request.method) return false;
        if (rule.path.endsWith('*')) {
            return routePath.startsWith(rule.path.replace('*', ''));
        }
        return routePath === rule.path;
    });

    if (matchedRule) {
        const userPerms = request.user.group_permissions || {};
        const isAdmin = request.user.role === 'Admin';
        
        // Search in all groups if it's a global view or if user is admin
        let hasAccess = isAdmin;
        
        if (!hasAccess) {
            for (const contextId in userPerms) {
                const perms = userPerms[contextId] || [];
                if (perms.includes(matchedRule.perm) || perms.includes('*') || perms.includes('admin')) {
                    hasAccess = true;
                    break;
                }
            }
        }

        if (!hasAccess) {
            return reply.status(403).send({ 
                statusCode: 403,
                intOpCode: 'SxGW403',
                data: null,
                error: 'Acceso Prohibido', 
                message: `No tienes el permiso necesario: ${matchedRule.perm}`,
                code: 'FORBIDDEN_ACCESS'
            });
        }
    }
});

// --- ROUTING ---
// User Service
fastify.all('/api/users', (request, reply) => proxyTo(request, reply, SERVICES.user, '/api/users'));
fastify.all('/api/users/*', (request, reply) => proxyTo(request, reply, SERVICES.user, '/api/users'));

// Groups Service
fastify.all('/api/groups', (request, reply) => proxyTo(request, reply, SERVICES.groups, '/api/groups'));
fastify.all('/api/groups/*', (request, reply) => proxyTo(request, reply, SERVICES.groups, '/api/groups'));

// Tickets Service
fastify.all('/api/tickets', (request, reply) => proxyTo(request, reply, SERVICES.tickets, '/api/tickets'));
fastify.all('/api/tickets/*', (request, reply) => proxyTo(request, reply, SERVICES.tickets, '/api/tickets'));

// Helper for proxying
function proxyTo(request, reply, serviceUrl, prefix) {
    const destPath = request.url.replace(prefix, '') || '/';
    return reply.from(`${serviceUrl}${destPath}`, {
        rewriteRequestHeaders: (req, headers) => ({
            ...headers,
            'x-user-id': request.user?.id || '',
            'x-user-role': request.user?.role || '',
            'x-user-groups': JSON.stringify(request.user?.group_ids || [])
        })
    });
}

// Permissions
fastify.all('/api/permissions', (request, reply) => {
    reply.from(`${SERVICES.groups}/permissions`);
});

const start = async () => {
    try {
        console.log('[Gateway] JWT_SECRET cargado:', process.env.JWT_SECRET ? 'SÍ' : 'NO');
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('API Gateway running on port 3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
