// middleware/authzMiddleware.js

/**
 * Middleware factory para verificar roles.
 * Acepta una lista de roles permitidos.
 * @param {...string} allowedRoles - Los roles que tienen permiso para acceder a la ruta.
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Se asume que el middleware 'protect' ya se ejecutó y añadió 'req.user'
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Acceso denegado. Rol de usuario no encontrado.' });
    }

    const userRole = req.user.role;

    // Comprueba si el rol del usuario está incluido en la lista de roles permitidos
    if (allowedRoles.includes(userRole)) {
      next(); // El usuario tiene un rol permitido, puede continuar
    } else {
      res.status(403).json({ message: 'Acceso denegado. No tienes los permisos necesarios.' });
    }
  };
};