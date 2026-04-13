const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user.routes');
const groupRoutes = require('./routes/group.routes');
const ticketRoutes = require('./routes/ticket.routes');
const permissionRoutes = require('./routes/permission.routes');
const authRoutes = require('./routes/auth.routes');
const apiLimiter = require('./middlewares/rateLimit');
const apiMetrics = require('./middlewares/metrics');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow Angular frontend
app.use(express.json()); // JSON parsing

// Aplicar Métricas y Rate Limiting global
app.use(apiMetrics);
app.use('/api', apiLimiter);

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/auth', authRoutes);

// Manejo de Error 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Arrancar Servidor
app.listen(PORT, () => {
    console.log(`Backend de ERP corriendo en el puerto ${PORT}`);
});
