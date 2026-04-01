require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow Angular frontend
app.use(express.json()); // JSON parsing

// Rutas
app.use('/api/users', userRoutes);

// Manejo de Error 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Arrancar Servidor
app.listen(PORT, () => {
    console.log(`Backend de ERP corriendo en el puerto ${PORT}`);
});
