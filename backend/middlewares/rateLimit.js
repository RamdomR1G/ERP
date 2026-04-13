const rateLimit = require('express-rate-limit');

/**
 * Limitador de peticiones para proteger el API
 * Configuración: 100 peticiones por minuto por IP
 */
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100, // Límite de 100 peticiones
    standardHeaders: true, // Retorna info del límite en los headers 'RateLimit-*'
    legacyHeaders: false, // Desactiva los headers 'X-RateLimit-*'
    message: {
        statusCode: 429,
        message: 'Too many requests',
        error: 'Rate limit exceeded. Please try again later.'
    },
    // Handler para asegurar el código 429 y formato JSON
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json(options.message);
    }
});

module.exports = apiLimiter;
