/**
 * Plant Routes - Rutas privadas (requieren autenticación)
 */
const express = require('express');
const router = express.Router();
const { plantController } = require('../controllers');
const { authenticate, authorize, upload, processImages } = require('../middlewares');
const { USER_ROLES } = require('../config/constants');

const { ADMIN, CATALOGER, CURATOR } = USER_ROLES;

// Todas requieren autenticación
router.use(authenticate);

// Estadísticas
router.get('/stats', plantController.getCollectionStats);

// CRUD con soporte de imágenes
router.post('/', 
     
    upload.array('images', 5),  // Máximo 5 imágenes
    processImages,
    plantController.createPlantRecord
);

router.get('/',  plantController.getAllPlantRecords);
router.get('/:id',  plantController.getPlantRecordById);

router.put('/:id', 
     
    upload.array('images', 5),
    processImages,
    plantController.updatePlantRecord
);

router.delete('/:id', authorize([ADMIN, CURATOR]), plantController.deletePlantRecord);

// Rutas específicas para imágenes
router.post('/:id/images', 
    
    upload.array('images', 5),
    processImages,
    plantController.addImages
);

router.delete('/:id/images/:imageId', 
    authorize([ADMIN, CURATOR]), 
    plantController.deleteImage
);

module.exports = router;
