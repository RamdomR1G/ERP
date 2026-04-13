const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

/**
 * Middleware para capturar métricas de la API y almacenarlas en Supabase.
 */
const apiMetrics = (req, res, next) => {
    const start = process.hrtime();

    // Escuchar cuando la respuesta termina
    res.on('finish', () => {
        const diff = process.hrtime(start);
        const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6);

        // No registrar peticiones a archivos estáticos si los hubiera, solo /api
        if (req.originalUrl.startsWith('/api')) {
            const metricData = {
                endpoint: req.originalUrl.split('?')[0], // Limpiar query params
                method: req.method,
                status_code: res.statusCode,
                response_time_ms: parseFloat(timeInMs.toFixed(2))
            };

            // Inserción asíncrona (Fire and forget para no bloquear al usuario)
            supabase.from('api_metrics').insert([metricData]).then(({ error }) => {
                if (error) {
                    console.error('[Metrics] Error al guardar en DB:', error.message);
                }
            });
        }
    });

    next();
};

module.exports = apiMetrics;
