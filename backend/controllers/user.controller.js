const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

exports.getUsers = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, role, group_id, status, joined_date, permissions');
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, role, group_id, status, joined_date, permissions')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Fetch user including password hash
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role, group_id, status, joined_date, permissions, password_hash')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 2. Comprobar password usando bcrypt
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 3. Return user context without the hash
        delete user.password_hash;
        
        res.json({
            message: 'Autenticación exitosa',
            user: user
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const payload = req.body;
        
        // 1. Validar que el email no exista (Supabase lo hará si hay constraint unique, pero mejor comprobarlo logicamente a veces, o confiar en el constraint y cachar el error)
        
        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(payload.password, salt);
        
        // 3. Preparar Inserción
        const { data, error } = await supabase
            .from('users')
            .insert([{
                name: payload.name,
                email: payload.email,
                password_hash: password_hash,
                role: payload.role,
                group_id: payload.group_id,
                status: payload.status || 'Active',
                permissions: payload.permissions || []
            }])
            .select('id')
            .single();

        if (error) throw error;
        
        res.status(201).json({ message: 'Usuario creado exitosamente', id: data.id });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'El email ya se encuentra registrado' });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body;
        
        const updates = { ...payload };
        
        // Si hay una contraseña en el payload, encriptarla nueva
        if (updates.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password_hash = await bcrypt.hash(updates.password, salt);
            delete updates.password;
        }

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select('id');

        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'El email proporcionado le pertenece a otro usuario' });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Business Logic Check: Prevent deletion if user has active/unfinished tickets
        const { data: tickets, error: ticketError } = await supabase
            .from('tickets')
            .select('id, status')
            .eq('assigned_to', id)
            .neq('status', 'Done');

        if (!ticketError && tickets && tickets.length > 0) {
            return res.status(400).json({ error: 'This user cannot be deleted because they have active tickets assigned that are not yet finished. You must reassign or complete them first.' });
        }

        // 2. Hard delete
        const { data, error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)
            .select('id');

        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

        res.json({ message: 'Usuario eliminado exitosamente (Hard delete)' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
