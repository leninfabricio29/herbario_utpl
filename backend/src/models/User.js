/**
 * User Model
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES_ARRAY, USER_ROLES } = require('../config/constants');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El email es requerido'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        minlength: 8,
        select: false
    },
    role: {
        type: String,
        enum: USER_ROLES_ARRAY,
        default: USER_ROLES.VIEWER
    },
    institution: {
        type: String,
        trim: true,
        default: 'Universidad Técnica Particular de Loja'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date
}, {
    timestamps: true,
    versionKey: false
});

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toPublicJSON = function() {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        institution: this.institution,
        isActive: this.isActive,
        createdAt: this.createdAt
    };
};

UserSchema.statics.findByEmailWithPassword = function(email) {
    return this.findOne({ email }).select('+password');
};

module.exports = mongoose.model('User', UserSchema);
