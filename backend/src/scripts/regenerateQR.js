/**
 * Script para regenerar códigos QR de todos los registros
 * Uso: npm run regenerate-qr
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { PlantRecord } = require('../models');
const { generatePlantQR } = require('../utils');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/herbario_utpl';

async function regenerateAllQRCodes() {
    try {
        console.log('🔗 Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Obtener todos los registros sin QR o todos si se quiere regenerar
        const plants = await PlantRecord.find({ isDeleted: false });
        console.log(`📊 Total de registros: ${plants.length}`);

        let updated = 0;
        let errors = 0;

        for (const plant of plants) {
            try {
                // Generar QR solo con los campos esenciales
                const { qrCodeDataUrl } = await generatePlantQR(plant);
                plant.qrCodeDataUrl = qrCodeDataUrl;
                await plant.save();
                updated++;
                // Mostrar progreso cada 100 registros
                if (updated % 100 === 0) {
                    console.log(`   Procesados: ${updated}/${plants.length}`);
                }
            } catch (err) {
                errors++;
                console.error(`❌ Error en ${plant.catalogNumber}: ${err.message}`);
            }
        }

        console.log('\n========================================');
        console.log(`✅ QR regenerados: ${updated}`);
        console.log(`❌ Errores: ${errors}`);
        console.log('========================================');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
        process.exit(0);
    }
}

regenerateAllQRCodes();
