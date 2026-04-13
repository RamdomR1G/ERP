require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedAdmin() {
    console.log("Generando Super Administrador...");
    
    // Contraseña por defecto
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash("admin1234", salt);

    // Lista de TODOS los permisos existentes en el UI
    const allPermissions = [
        'group:view', 'group:add', 'group:edit', 'group:delete',
        'user:view', 'user:add', 'user:edit', 'user:delete',
        'ticket:view', 'ticket:add', 'ticket:edit', 'ticket:delete', 'ticket:edit_state'
    ];

    const { data, error } = await supabase
        .from('users')
        .insert([{
            name: 'Super Admin',
            email: 'admin@erp.com',
            password_hash: password_hash,
            role: 'Admin',
            group_id: 'Management',
            status: 'Active',
            joined_date: new Date().toISOString(),
            permissions: allPermissions
        }]);

    if (error) {
        if (error.code === '23505') {
            console.log("¡El administrador admin@erp.com ya existe en la base de datos!");
        } else {
            console.error("Error creando el admin:", error);
        }
    } else {
        console.log("✅ ¡Administrador creado exitosamente!");
        console.log("Email: admin@erp.com");
        console.log("Password: admin1234");
    }
}

seedAdmin();
