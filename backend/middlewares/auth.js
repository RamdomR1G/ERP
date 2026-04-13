const jwt = require('jsonwebtoken');

/**
 * Middleware para proteger rutas mediante validación de JWT
 */
module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Acceso denegado. No se proporcionó un token de autenticación (Bearer).' 
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Inyectamos la información del usuario en la petición para uso de los controladores
        req.user = decoded;
        
        next();
    } catch (err) {
        console.error('[AuthMiddleware] JWT Verification Error:', err.message);
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        
        res.status(401).json({ error: 'Token inválido' });
    }
};
