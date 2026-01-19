/**
 * Public Routes - Acceso QR sin autenticación
 */
const express = require('express');
const router = express.Router();
const { plantPublicController } = require('../controllers');

// Endpoints públicos
router.get('/specimen/:occurrenceID', plantPublicController.getPlantByOccurrenceID);
router.get('/specimens', plantPublicController.getPublicPlantsList);
router.get('/families', plantPublicController.getPublicFamilies);
router.get('/stats', plantPublicController.getPublicStats);
// Ruta pública amigable para QR y enlaces
router.get('/plants/:occurrenceID', plantPublicController.getPlantByOccurrenceID);

module.exports = router;
