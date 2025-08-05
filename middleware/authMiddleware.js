import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
    let token;

    // 1. Leer el token del encabezado 'Authorization'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtener el token (ej. "Bearer eyJhbGciOiJI...") -> "eyJhbGciOiJI..."
            token = req.headers.authorization.split(' ')[1].trim();

            // 2. Verificar el token usando la clave secreta
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (!decoded.user || !decoded.user.id) {
                throw new Error('El formato del token es inválido.');
            }
            const userId = decoded.user.id;

            // 3. Obtener el usuario desde la BD usando el ID del token
            req.user = await User.findById(userId).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'No autorizado, el usuario de este token ya no existe.' });
            }

            // 4. Si todo es correcto, continuar a la siguiente función (el controlador)
            next();

        } catch (error) {
            console.error('Error de autenticación:', error);
            res.status(401).json({ message: 'No autorizado, token falló.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no hay token.' });
    }
};

export default protect;
