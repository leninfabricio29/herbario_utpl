/**
 * Frontend Server - Herbario UTPL Admin
 */
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`🌿 Frontend corriendo en http://localhost:${PORT}`);
    console.log(`📡 API Backend: ${process.env.API_BASE_URL || 'http://localhost:3000/api'}`);
});
