const fastify = require('fastify')({ logger: true });
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const proxy = require('@fastify/http-proxy');
const jwt = require('@fastify/jwt');
const cors = require('@fastify/cors');
const rateLimit = require('@fastify/rate-limit');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// REGISTROS
fastify.register(cors, {
    origin: '*', // Permitir peticiones desde el Angular (4200)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-group-id']
});
fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => {
        return {
            statusCode: 429,
            error: 'Too Many Requests',
            message: `Demasiadas peticiones. Por favor, intenta de nuevo en ${context.after}.`
        };
    }
});
fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'secret-key'
});

// GLOBAL API METRICS TRACKER AND JSON WRAPPER
fastify.addHook('onSend', async (request, reply, payload) => {
    // 1. REGISTRAR MÉTRICAS (Envió Seguro)
    try {
        const method = request.method || 'UNKNOWN';
        const endpoint = request.url ? request.url.split('?')[0] : '/';
        const status_code = parseInt(reply.statusCode) || 200;
        const response_time_ms = parseFloat(reply.getResponseTime ? reply.getResponseTime() : 0.0) || 0.0;

        supabase.from('api_metrics').insert([{
            endpoint: endpoint,
            method: method,
            status_code: status_code,
            response_time_ms: response_time_ms
        }]).then(({ error }) => {
            if (error) console.error("[Metrics DB Error]:", error.message);
            else console.log(`[Metrics Captured]: ${method} ${endpoint} - ${status_code} (${response_time_ms.toFixed(2)}ms)`);
        }).catch(() => {});
    } catch (e) {
        console.error("[Metrics Sync Exception]:", e.message);
    }

    const contentType = reply.getHeader('content-type');
    // Solo procesar si es JSON y no es un flujo vacío
    if (payload && contentType && contentType.includes('application/json')) {
        try {
            const body = JSON.parse(payload);
            
            // Si ya tiene el esquema (evitar doble envoltura), devolver original
            if (body && typeof body === 'object' && 'statusCode' in body && 'data' in body) {
                return payload;
            }

            const wrapper = {
                statusCode: reply.statusCode,
                intOpCode: reply.statusCode >= 400 ? 0 : 1,
                data: body
            };
            return JSON.stringify(wrapper);
        } catch (e) {
            return payload;
        }
    }
    return payload;
});

// CONFIGURACION DE PERMISOS REQUERIDOS POR RUTA
const PERMISSION_MAP = {
    'POST:/api/tickets': 'ticket:add',
    'PUT:/api/tickets': 'ticket:edit',
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
        
        // PROPAGATE IDENTITY: Inject headers for microservices
        request.headers['x-user-id'] = decoded.id;
        request.headers['x-user-role'] = decoded.role;
        request.headers['x-user-groups'] = JSON.stringify(decoded.group_ids || []);
        
        // VALIDACION DE PERMISOS (PBAC)
        const method = request.method;
        const segments = request.url.split('?')[0].split('/').filter(Boolean);
        const basePath = segments.length >= 2 ? `/${segments[0]}/${segments[1]}` : request.url.split('?')[0];
        const routeKey = `${method}:${basePath}`;
        const requiredPerm = PERMISSION_MAP[routeKey];

        if (requiredPerm) {
            const groupId = request.headers['x-group-id'] || request.query.groupId;
            
            // 1. Admin Global
            if (decoded.role === 'Admin') {
                return; // Validado
            } 
            // 2. Faltan headers de contexto
            else if (!groupId) {
                return reply.code(400).send({ error: 'Falta contexto de grupo (x-group-id req)' });
            } 
            // 3. Validar permisos en el grupo
            else {
                const userPerms = (decoded.group_permissions && decoded.group_permissions[groupId]) || [];
                
                // PROPAGATE PERMISSIONS: Enable microservice to check assignee exceptions
                request.headers['x-user-permissions'] = JSON.stringify(userPerms);

                if (!userPerms.includes(requiredPerm) && !userPerms.includes('*')) {
                    return reply.code(403).send({ error: 'Prohibido', message: `No tienes permiso: ${requiredPerm}` });
                }
            }
        } else {
            // IF NO REQUIRED PERM IN MAP, still propagate permissions if authenticated
            const groupId = request.headers['x-group-id'] || request.query.groupId;
            if (groupId && decoded.group_permissions && decoded.group_permissions[groupId]) {
                request.headers['x-user-permissions'] = JSON.stringify(decoded.group_permissions[groupId]);
            }
        }
    } catch (err) {
        // ERROR CRÍTICO EVITADO: Añadido "return" para evitar que el proxy continúe a pesar de la falla de autorización
        return reply.code(401).send({ error: 'No autorizado', message: 'Token o contexto inválido' });
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
        //statuscode y apidata
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
