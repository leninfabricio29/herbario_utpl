/**
 * Dashboard Routes
 */
const express = require('express');
const router = express.Router();
const { plantsAPI, authAPI } = require('../services/api.service');
const { isAuthenticated, isAdmin } = require('../middlewares/auth.middleware');

// Middleware: todas las rutas requieren autenticación
router.use(isAuthenticated);

// Dashboard principal
router.get('/', async (req, res) => {
    try {
        const stats = await plantsAPI.getStats(req.session.token);
        
        res.render('dashboard/index', {
            title: 'Dashboard - Herbario UTPL',
            stats: stats.data || {},
            page: 'dashboard'
        });
    } catch (error) {
        console.error('Error dashboard:', error.message);
        res.render('dashboard/index', {
            title: 'Dashboard - Herbario UTPL',
            stats: { total: 0, byFamily: [], byCountry: [] },
            page: 'dashboard',
            error: error.message
        });
    }
});

// Usuarios (solo admin)
router.get('/users', isAdmin, async (req, res) => {
    try {
        const result = await authAPI.getUsers(req.session.token);
        
        res.render('dashboard/users', {
            title: 'Usuarios - Herbario UTPL',
            users: result.data?.users || [],
            page: 'users'
        });
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/dashboard');
    }
});

// Perfil
router.get('/profile', async (req, res) => {
    res.render('dashboard/profile', {
        title: 'Mi Perfil - Herbario UTPL',
        page: 'profile'
    });
});

module.exports = router;
