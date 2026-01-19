/**
 * Plant Controller - CRUD privado con soporte de imágenes
 */
const { PlantRecord } = require('../models');
const { generatePlantQR } = require('../utils');
const { asyncHandler, deleteImageFile } = require('../middlewares');
const { PAGINATION } = require('../config/constants');

const createPlantRecord = asyncHandler(async (req, res) => {
    const plantData = req.body;
    
    // **PARSEAR CAMPOS JSON QUE VIENEN COMO STRING DESDE FORMDATA**
    if (plantData.taxonomy && typeof plantData.taxonomy === 'string') {
        try {
            plantData.taxonomy = JSON.parse(plantData.taxonomy);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Error al parsear taxonomía: formato JSON inválido'
            });
        }
    }
    
    // Parsear permit si existe
    if (plantData.permit && typeof plantData.permit === 'string') {
        try {
            plantData.permit = JSON.parse(plantData.permit);
        } catch (error) {
            console.warn('Error parsing permit:', error);
            plantData.permit = undefined;
        }
    }
    
    plantData.createdBy = req.userId;

    // Si hay imágenes procesadas, agregarlas
    if (req.processedImages && req.processedImages.length > 0) {
        plantData.images = req.processedImages;
    }

    const plant = new PlantRecord(plantData);
    await plant.save();

    // Generar QR con el JSON público
    const plantPublicJSON = plant.toPublicJSON();
    // Generar QR solo con los campos esenciales
    const { qrCodeDataUrl } = await generatePlantQR(plant);
    plant.qrCodeDataUrl = qrCodeDataUrl;
    await plant.save();

    res.status(201).json({
        success: true,
        message: 'Registro creado',
        data: { 
            plant, 
            qrCode: qrCodeDataUrl,
            imagesUploaded: plant.images?.length || 0
        }
    });
});

const getAllPlantRecords = asyncHandler(async (req, res) => {
    const {
        page = 1, limit = 20,
        family, genus, country, stateProvince, year, search
    } = req.query;

    const filter = { isDeleted: false };
    if (family) filter['taxonomy.family'] = new RegExp(family, 'i');
    if (genus) filter['taxonomy.genus'] = new RegExp(genus, 'i');
    if (country) filter.country = new RegExp(country, 'i');
    if (stateProvince) filter.stateProvince = new RegExp(stateProvince, 'i');
    if (year) filter.year = year;
    if (search) {
        filter.$or = [
            { 'taxonomy.scientificName': new RegExp(search, 'i') },
            { catalogNumber: new RegExp(search, 'i') }
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [plants, total] = await Promise.all([
        PlantRecord.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        PlantRecord.countDocuments(filter)
    ]);

    res.json({
        success: true,
        data: plants,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit))
        }
    });
});

const getPlantRecordById = asyncHandler(async (req, res) => {
    const plant = await PlantRecord.findOne({ _id: req.params.id, isDeleted: false });
    if (!plant) {
        return res.status(404).json({ success: false, message: 'No encontrado' });
    }

    // Si no tiene QR, generarlo y guardarlo
    if (!plant.qrCodeDataUrl && plant.occurrenceID) {
        try {
            const { publicUrl, qrCodeDataUrl } = await generatePlantQR(plant.occurrenceID);
            plant.publicUrl = publicUrl;
            plant.qrCodeDataUrl = qrCodeDataUrl;
            await plant.save();
        } catch (err) {
            console.error('Error generando QR:', err.message);
        }
    }

    res.json({ success: true, data: { plant } });
});

const updatePlantRecord = asyncHandler(async (req, res) => {
    const updateData = req.body;
    delete updateData.occurrenceID;
    delete updateData.createdBy;
    updateData.updatedBy = req.userId;

    // Si hay nuevas imágenes, agregarlas a las existentes
    if (req.processedImages && req.processedImages.length > 0) {
        const plant = await PlantRecord.findOne({ _id: req.params.id, isDeleted: false });
        if (plant) {
            updateData.images = [...(plant.images || []), ...req.processedImages];
        }
    }

    const plant = await PlantRecord.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!plant) {
        return res.status(404).json({ success: false, message: 'No encontrado' });
    }

    // Regenerar QR con los datos actuales
    const { qrCodeDataUrl } = await generatePlantQR(plant);
    plant.qrCodeDataUrl = qrCodeDataUrl;
    await plant.save();

    res.json({ 
        success: true, 
        message: 'Actualizado', 
        data: { plant },
        totalImages: plant.images?.length || 0
    });
});

// Agregar imágenes a un registro existente
const addImages = asyncHandler(async (req, res) => {
    const plant = await PlantRecord.findOne({ _id: req.params.id, isDeleted: false });
    if (!plant) {
        return res.status(404).json({ success: false, message: 'No encontrado' });
    }

    if (!req.processedImages || req.processedImages.length === 0) {
        return res.status(400).json({ success: false, message: 'No se enviaron imágenes' });
    }

    plant.images = [...(plant.images || []), ...req.processedImages];
    plant.updatedBy = req.userId;

    // Regenerar QR con los datos actuales
    const { qrCodeDataUrl } = await generatePlantQR(plant);
    plant.qrCodeDataUrl = qrCodeDataUrl;
    await plant.save();

    res.json({
        success: true,
        message: `${req.processedImages.length} imagen(es) agregada(s)`,
        data: { 
            images: plant.images,
            total: plant.images.length
        }
    });
});

// Eliminar una imagen específica
const deleteImage = asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;
    const plant = await PlantRecord.findOne({ _id: id, isDeleted: false });
    if (!plant) {
        return res.status(404).json({ success: false, message: 'No encontrado' });
    }

    const imageIndex = plant.images.findIndex(img => img.id === imageId);
    if (imageIndex === -1) {
        return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
    }

    const [image] = plant.images.splice(imageIndex, 1);
    plant.updatedBy = req.userId;
    if (image && image.filename) {
        deleteImageFile(image.filename);
    }

    // Regenerar QR con los datos actuales
    const { qrCodeDataUrl } = await generatePlantQR(plant);
    plant.qrCodeDataUrl = qrCodeDataUrl;
    await plant.save();

    res.json({
        success: true,
        message: 'Imagen eliminada',
        data: { images: plant.images, total: plant.images.length }
    });
});

const deletePlantRecord = asyncHandler(async (req, res) => {
    const plant = await PlantRecord.findOne({ _id: req.params.id, isDeleted: false });
    if (!plant) {
        return res.status(404).json({ success: false, message: 'No encontrado' });
    }

    plant.isDeleted = true;
    plant.deletedAt = new Date();
    await plant.save();

    res.json({ success: true, message: 'Eliminado' });
});

const getCollectionStats = asyncHandler(async (req, res) => {
    const [total, byFamily, byCountry] = await Promise.all([
        PlantRecord.countDocuments({ isDeleted: false }),
        PlantRecord.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: '$taxonomy.family', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]),
        PlantRecord.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: '$country', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ])
    ]);

    res.json({
        success: true,
        data: { total, byFamily, byCountry }
    });
});

module.exports = {
    createPlantRecord,
    getAllPlantRecords,
    getPlantRecordById,
    updatePlantRecord,
    deletePlantRecord,
    getCollectionStats,
    addImages,
    deleteImage
};
