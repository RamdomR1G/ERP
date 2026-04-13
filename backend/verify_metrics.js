const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function verifyMetrics() {
    console.log('--- Verificación de Métricas API ---');
    
    const { data, error } = await supabase
        .from('api_metrics')
        .select('endpoint, method, response_time_ms')
        .limit(10);

    if (error) {
        if (error.code === '42P01') {
            console.error('ERROR: La tabla "api_metrics" no existe en Supabase.');
            console.log('Tip: Ejecuta el siguiente SQL en el editor de Supabase:');
            console.log(`
CREATE TABLE api_metrics (
  id BIGSERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`);
        } else {
            console.error('Error al consultar métricas:', error.message);
        }
        return;
    }

    if (data.length === 0) {
        console.log('La tabla existe pero está vacía. Realiza algunas peticiones a la API para ver datos.');
    } else {
        console.log(`Se han encontrado ${data.length} registros de métricas.`);
        console.table(data);
        
        // Calcular promedio simple para demostrar que los datos son útiles
        const avg = data.reduce((acc, curr) => acc + curr.response_time_ms, 0) / data.length;
        console.log(\`Tiempo de respuesta promedio (muestra): \${avg.toFixed(2)}ms\`);
    }
}

verifyMetrics();
