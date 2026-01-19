/**
 * Seed Admin - Crear usuario admin por defecto
 */
const { User } = require('../models');
const { USER_ROLES } = require('../config/constants');

const createDefaultAdmin = async () => {
    try {
        const adminEmail = 'admin@utpl.edu.ec';
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (existingAdmin) {
            console.log('✅ Usuario administrador ya existe');
            return;
        }

        await User.create({
            name: 'Administrador UTPL',
            email: adminEmail,
            password: 'Admin123!',
            role: USER_ROLES.ADMIN,
            institution: 'Universidad Técnica Particular de Loja'
        });
        
        console.log('🔐 Admin creado: admin@utpl.edu.ec / Admin123!');
    } catch (error) {
        console.error('Error creando admin:', error.message);
    }
};

module.exports = { createDefaultAdmin };
