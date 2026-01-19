/**
 * Auth Middleware - Verificar sesión
 */

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.token && req.session.user) {
        return next();
    }
    req.flash('error', 'Debes iniciar sesión para acceder');
    res.redirect('/login');
};

const isAdmin = (req, res, next) => {
    if (req.session.user?.role === 'ADMIN') {
        return next();
    }
    req.flash('error', 'No tienes permisos de administrador');
    res.redirect('/dashboard');
};

const isGuest = (req, res, next) => {
    if (!req.session.token) {
        return next();
    }
    res.redirect('/dashboard');
};

module.exports = { isAuthenticated, isAdmin, isGuest };
