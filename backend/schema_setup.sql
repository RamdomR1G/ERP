-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: GROUPS
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(255),
    description TEXT,
    color VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA: PERMISSIONS (Catálogo Maestro)
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(255) NOT NULL,
    name VARCHAR(255) UNIQUE NOT NULL,    -- ej: 'ticket:view'
    label VARCHAR(255) NOT NULL           -- ej: 'View Tickets'
);

-- 4. TABLA: TICKETS
CREATE TABLE IF NOT EXISTS public.tickets (
    id BIGSERIAL PRIMARY KEY,  -- BIGSERIAL preserva la ID como números para que concuerde con tu Angular actual (ej: Ticket 1, 2)
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(100) DEFAULT 'Pending',
    priority VARCHAR(100) DEFAULT 'Medium',
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    comments JSONB DEFAULT '[]'::jsonb,
    history JSONB DEFAULT '[]'::jsonb,
    created_on TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SEMILLA INICIAL (Catálogo de Permisos Fijos)
-- Para que no tengas que escribirlos a mano, los inyectaremos usando SQL
INSERT INTO public.permissions (category, name, label) VALUES
    ('Tickets', 'ticket:view', 'View Tickets'),
    ('Tickets', 'ticket:add', 'Create Tickets'),
    ('Tickets', 'ticket:edit', 'Master Edit Tickets'),
    ('Tickets', 'ticket:edit_state', 'Move Assigned Tickets'),
    ('Tickets', 'ticket:delete', 'Delete Tickets'),
    
    ('Users', 'users:view', 'View Users'),
    ('Users', 'user:add', 'Create Users'),
    ('Users', 'user:edit', 'Edit Users'),
    ('Users', 'user:delete', 'Delete Users'),
    
    ('Groups', 'group:view', 'View Groups'),
    ('Groups', 'group:add', 'Create Groups'),
    ('Groups', 'group:edit', 'Edit Groups'),
    ('Groups', 'group:delete', 'Delete Groups')
ON CONFLICT (name) DO NOTHING;

-- 6. SEMILLA INICIAL (Grupos)
INSERT INTO public.groups (id, name, icon, description, color) VALUES
    (uuid_generate_v4(), 'Management', 'pi pi-briefcase', 'Executive and administrative staff', '#6366f1'),
    (uuid_generate_v4(), 'Sales', 'pi pi-chart-line', 'Sales representatives and account managers', '#22c55e'),
    (uuid_generate_v4(), 'Support', 'pi pi-headphones', 'Customer support and helpdesk', '#0ea5e9')
;
