/**
 * Role Middleware - Control de acceso por roles
 */
const { USER_ROLES } = require('../config/constants');

const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Acceso denegado. Rol requerido: ${allowedRoles.join(', ')}`,
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    };
};

const isAdmin = roleMiddleware(USER_ROLES.ADMIN);
const canCatalog = roleMiddleware(USER_ROLES.ADMIN, USER_ROLES.CATALOGER, USER_ROLES.CURATOR);
const canCurate = roleMiddleware(USER_ROLES.ADMIN, USER_ROLES.CURATOR);

module.exports = { roleMiddleware, isAdmin, canCatalog, canCurate };
