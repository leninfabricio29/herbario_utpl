/**
 * Server Entry Point
 */
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const { createDefaultAdmin } = require('./utils');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();

        await createDefaultAdmin();

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
            console.log(`📍 Health: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar:', error.message);
        process.exit(1);
    }
};

startServer();
