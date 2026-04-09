require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
    console.log('--- ERP PERMISSIONS FIXER ---');
    
    // 1. Find the admin user (usually the one you logged in with)
    // We'll search for 'Admin' role users
    const { data: users, error } = await supabase.from('users').select('id, email, group_permissions').eq('role', 'Admin');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    if (!users || users.length === 0) {
        console.log('No Admin users found to fix.');
        return;
    }

    for (const user of users) {
        console.log(`Updating permissions for: ${user.email}`);
        
        // Give 'global' full permissions [*] so they can see the sidebar and dashboard
        const updatedPermissions = user.group_permissions || {};
        updatedPermissions['global'] = ['*']; 

        const { error: updateError } = await supabase
            .from('users')
            .update({ group_permissions: updatedPermissions })
            .eq('id', user.id);

        if (updateError) {
            console.error(`Failed to update ${user.email}:`, updateError);
        } else {
            console.log(`SUCCESS: ${user.email} now has Global Permissions.`);
        }
    }

    console.log('Done. Please LOG OUT and LOG IN again in the web app.');
}

fix();
