const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function normalize() {
    console.log('--- Iniciando Normalización de Permisos ---');
    
    const { data: users, error } = await supabase.from('users').select('id, name, permissions, group_permissions');
    
    if (error) {
        console.error('Error al obtener usuarios:', error);
        return;
    }

    let updatedCount = 0;

    for (const user of users) {
        let changed = false;
        
        // 1. Normalizar array de permisos global
        if (Array.isArray(user.permissions)) {
            const index = user.permissions.indexOf('users:view');
            if (index !== -1) {
                user.permissions[index] = 'user:view';
                changed = true;
                console.log(`[${user.name}] Corrigiendo permiso global plural.`);
            }
        }

        // 2. Normalizar objeto de permisos por grupo
        if (user.group_permissions && typeof user.group_permissions === 'object') {
            for (const groupId in user.group_permissions) {
                const perms = user.group_permissions[groupId];
                if (Array.isArray(perms)) {
                    const idx = perms.indexOf('users:view');
                    if (idx !== -1) {
                        perms[idx] = 'user:view';
                        changed = true;
                        console.log(`[${user.name}] Corrigiendo permiso contextual en grupo ${groupId}.`);
                    }
                }
            }
        }

        if (changed) {
            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    permissions: user.permissions, 
                    group_permissions: user.group_permissions 
                })
                .eq('id', user.id);
            
            if (updateError) {
                console.error(`Error actualizando usuario ${user.name}:`, updateError);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`--- Normalización Finalizada. Usuarios actualizados: ${updatedCount} ---`);
}

normalize();
