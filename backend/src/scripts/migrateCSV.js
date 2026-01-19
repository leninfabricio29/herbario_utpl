/**
 * Script de Migración CSV - BD-HUTPL.csv a MongoDB
 * Ejecutar: npm run migrate
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');

const connectDB = require('../config/database');
const { PlantRecord } = require('../models');
const axios = require('axios');

// Ruta al CSV
const CSV_PATH = path.resolve(__dirname, '../../BD-HUTPL.csv');

// Mapeo de columnas CSV a campos del modelo
const mapCSVToModel = (row) => {
    return {
        // Darwin Core Record
        type: row.type || 'PhysicalObject',
        language: row.language || 'es',
        license: row.license || '',
        rightsHolder: row.rightsHolder || 'Universidad Técnica Particular de Loja',
        institutionCode: row.institutionCode || 'UTPL',
        collectionCode: row.collectionCode || 'HUTPL',
        basisOfRecord: row.basisOfRecord || 'PreservedSpecimen',

        // Occurrence
        occurrenceID: row.occurrenceID || '',
        catalogNumber: row.catalogNumber || '',
        otherCatalogNumbers: row.otherCatalogNumbers || '',
        recordNumber: row.recordNumber || '',
        recordedBy: row.recordedBy || '',

        // Event
        eventDate: row.eventDate ? new Date(row.eventDate) : null,
        verbatimEventDate: row.verbatimEventDate || row.eventDate || '',
        year: row.year ? parseInt(row.year) : null,
        month: row.month ? parseInt(row.month) : null,
        day: row.day ? parseInt(row.day) : null,

        // Location
        continent: row.continent || '',
        country: row.country || 'Ecuador',
        countryCode: row.countryCode || 'EC',
        stateProvince: row.stateProvince || '',
        county: row.county || '',
        locality: row.locality || '',
        habitat: row.habitat || '',
        verbatimElevation: row.verbatimElevation || '',
        minimumElevationInMeters: row.minimumElevationInMeters ? parseFloat(row.minimumElevationInMeters) : null,
        maximumElevationInMeters: row.maximumElevationInMeters ? parseFloat(row.maximumElevationInMeters) : null,
        verbatimCoordinates: row.verbatimCoordinates || '',
        verbatimCoordinateSystem: row.verbatimCoordinateSystem || '',
        decimalLatitude: row.decimalLatitude ? parseFloat(row.decimalLatitude) : null,
        decimalLongitude: row.decimalLongitude ? parseFloat(row.decimalLongitude) : null,
        geodeticDatum: row.geodeticDatum || 'WGS84',
        georeferenceRemarks: row.georeferenceRemarks || '',

        // Taxonomy (embedded)
        taxonomy: {
            kingdom: row.kingdom || 'Plantae',
            phylum: row.phylum || '',
            class: row.class || '',
            order: row.order || '',
            family: row.family || '',
            genus: row.genus || '',
            specificEpithet: row.specificEpithet || '',
            infraspecificEpithet: row.infraspecificEpithet || '',
            taxonRank: row.taxonRank || row.verbatimTaxonRank || '',
            scientificName: row.scientificName || '',
            scientificNameAuthorship: row.scientificNameAuthorship || '',
            vernacularName: row.vernacularName || '',
            taxonID: row.taxonID || '',
            nomenclaturalCode: row.nomenclaturalCode || 'ICN'
        },

        // Identification
        identifiedBy: row.identifiedBy || '',
        herbAffiliation: row.herbAffiliation || '',
        dateIdentified: row.dateIdentified || '',
        identificationQualifier: row.identificationQualifier || '',
        typeStatus: row.typeStatus || '',
        verbatimTaxonRank: row.verbatimTaxonRank || '',
        verbatimScientificName: row.verbatimScientificName || row.scientificName || '',
        synonym: row.synonym || '',
        previousIdentifications: row.previousIdentifications || '',

        // Cataloging
        catalogerName: row.catalogerName || '',
        catalogYear: row.catalogYear ? parseInt(row.catalogYear) : null,

        // Permit (embedded)
        permit: {
            permitBy: row.permitBy || '',
            permitName: row.permitName || '',
            permitType: row.permitType || '',
            permitStatus: row.permitStatus || '',
            permitURI: row.permitURI || '',
            permitText: row.permitText || ''
        },

        // Additional fields
        growthHabit: row.growthHabit || '',
        establishmentMeans: row.establishmentMeans || '',
        duplicateLocation: row.duplicateLocation || '',
        associatedSequences: row.associatedSequences || '',
        useCategory: row.useCategory || '',
        verbatimUse: row.verbatimUse || '',

        // MAE/Mobilization
        mobilizationCode: row.mobilizationCode || '',
        collectionCodeMAE: row.collectionCodeMAE || '',
        depositCode: row.depositCode || '',

        // Observations
        observation: row.observation || row.occurrenceRemarks || '',

        // Metadata
        importedFromCSV: true,
        importedAt: new Date(),
        isDeleted: false
    };
};

const migrateCSV = async () => {
    console.log('🚀 Iniciando migración de BD-HUTPL.csv...\n');

    // Verificar que existe el archivo
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`❌ Archivo no encontrado: ${CSV_PATH}`);
        console.log('   Asegúrate de que BD-HUTPL.csv esté en la raíz del proyecto.');
        process.exit(1);
    }

    try {
        await connectDB();
        console.log('✅ Conectado a MongoDB\n');

        const records = [];
        let rowCount = 0;

        // Leer CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(CSV_PATH)
                .pipe(csv())
                .on('data', (row) => {
                    rowCount++;
                    try {
                        const mapped = mapCSVToModel(row);
                        if (mapped.occurrenceID) {
                            records.push(mapped);
                        } else {
                            console.warn(`⚠️  Fila ${rowCount}: Sin occurrenceID, omitida`);
                        }
                    } catch (err) {
                        console.error(`❌ Error en fila ${rowCount}: ${err.message}`);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`📊 Filas leídas: ${rowCount}`);
        console.log(`📋 Registros válidos: ${records.length}\n`);

        if (records.length === 0) {
            console.log('⚠️  No hay registros para migrar.');
            process.exit(0);
        }

        // Verificar duplicados
        const existingIds = await PlantRecord.find({ 
            occurrenceID: { $in: records.map(r => r.occurrenceID) } 
        }).select('occurrenceID');
        
        const existingSet = new Set(existingIds.map(r => r.occurrenceID));
        const newRecords = records.filter(r => !existingSet.has(r.occurrenceID));

        console.log(`🔍 Ya existentes: ${existingSet.size}`);
        console.log(`➕ Nuevos a insertar: ${newRecords.length}\n`);

        if (newRecords.length === 0) {
            console.log('✅ Todos los registros ya existen. Nada que migrar.');
            process.exit(0);
        }


        // Insertar usando el endpoint del controlador
        const API_URL = 'http://localhost:3000/api/plants'; // Cambia si tu backend está en otro puerto o dominio
        const AUTH_TOKEN = process.env.MIGRATION_TOKEN || '';
        let inserted = 0;
        let errors = 0;

        for (const record of newRecords) {
            try {
                const res = await axios.post(API_URL, record, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(AUTH_TOKEN && { 'Authorization': `Bearer ${AUTH_TOKEN}` })
                    }
                });
                inserted++;
                console.log(`✅ Insertado: ${record.occurrenceID}`);
            } catch (err) {
                errors++;
                if (err.response && err.response.data) {
                    console.error(`❌ Error al insertar ${record.occurrenceID}:`, err.response.data);
                } else {
                    console.error(`❌ Error al insertar ${record.occurrenceID}:`, err.message);
                }
            }
        }

        console.log('\n══════════════════════════════════════════');
        console.log('           MIGRACIÓN COMPLETADA           ');
        console.log('══════════════════════════════════════════');
        console.log(`   ✅ Insertados: ${inserted}`);
        console.log(`   ❌ Errores: ${errors}`);
        console.log('══════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error en migración:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexión cerrada');
    }
};

migrateCSV();
