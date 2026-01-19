/**
 * Database Configuration
 * Configuración y conexión a MongoDB usando Mongoose
 */

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            throw new Error('MONGODB_URI no está definido en las variables de entorno');
        }

        const conn = await mongoose.connect(mongoURI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
        console.log(`📁 Base de datos: ${conn.connection.name}`);

        mongoose.connection.on('error', (err) => {
            console.error('❌ Error de MongoDB:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB desconectado');
        });

    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error.message);
        throw error;
    }
};

module.exports = connectDB;
