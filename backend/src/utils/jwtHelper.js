/**
 * JWT Helper
 */
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

const generateAuthResponse = (user) => {
    const token = generateToken(user);
    return {
        token,
        tokenType: 'Bearer',
        user: user.toPublicJSON ? user.toPublicJSON() : user
    };
};

module.exports = { generateToken, generateAuthResponse };
