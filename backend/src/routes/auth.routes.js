/**
 * Auth Routes
 */
const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares');
const { USER_ROLES } = require('../config/constants');

// Públicas
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

// Protegidas
router.get('/profile', authenticate, authController.getProfile);
router.get('/users', authenticate, authorize([USER_ROLES.ADMIN]), authController.listUsers);

module.exports = router;
