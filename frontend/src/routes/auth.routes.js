/**
 * Auth Routes - Login/Logout
 */
const express = require('express');
const router = express.Router();
const { authAPI } = require('../services/api.service');
const { isGuest, isAuthenticated } = require('../middlewares/auth.middleware');

// Home - Redirigir
router.get('/', (req, res) => {
    if (req.session.token) {
        return res.redirect('/dashboard');
    }
    res.redirect('/login');
});

// Login Page
router.get('/login', isGuest, (req, res) => {
    res.render('auth/login', { 
        title: 'Iniciar Sesión - Herbario UTPL',
        layout: 'layouts/auth'
    });
});

// Login POST
router.post('/login', isGuest, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            req.flash('error', 'Email y contraseña son requeridos');
            return res.redirect('/login');
        }

        const result = await authAPI.login(email, password);

        if (result.success) {
            req.session.token = result.data.token;
            req.session.user = result.data.user;
            req.flash('success', `Bienvenido, ${result.data.user.name}`);
            return res.redirect('/dashboard');
        }

        req.flash('error', result.message || 'Error al iniciar sesión');
        res.redirect('/login');

    } catch (error) {
        req.flash('error', error.message || 'Error de conexión con el servidor');
        res.redirect('/login');
    }
});

// Logout
router.get('/logout', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Error al cerrar sesión:', err);
        res.redirect('/login');
    });
});

module.exports = router;
