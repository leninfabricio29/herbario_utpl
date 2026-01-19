/**
 * Auth Controller
 */
const { User } = require('../models');
const { generateAuthResponse } = require('../utils');
const { asyncHandler } = require('../middlewares');

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, institution } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email ya registrado' });
    }

    const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: role || 'CATALOGER',
        institution
    });

    res.status(201).json({
        success: true,
        message: 'Usuario registrado',
        data: { user: user.toPublicJSON() }
    });
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findByEmailWithPassword(email.toLowerCase());
    if (!user) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Cuenta desactivada' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({
        success: true,
        message: 'Login exitoso',
        data: generateAuthResponse(user)
    });
});

const getProfile = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        data: { user: req.user.toPublicJSON() }
    });
});

const listUsers = asyncHandler(async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({
        success: true,
        data: { users: users.map(u => u.toPublicJSON()) }
    });
});

module.exports = { registerUser, loginUser, getProfile, listUsers };
