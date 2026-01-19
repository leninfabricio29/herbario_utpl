/**
 * Plant Routes - CRUD de especímenes
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const { plantsAPI } = require('../services/api.service');
const { isAuthenticated } = require('../middlewares/auth.middleware');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Configurar multer para manejar archivos en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'), false);
        }
    }
});

router.use(isAuthenticated);

// Listado de plantas
router.get('/', async (req, res) => {
    try {
        const { page = 1, search, family, country } = req.query;
        const result = await plantsAPI.getAll(req.session.token, { page, search, family, country });

        res.render('plants/index', {
            title: 'Especímenes - Herbario UTPL',
            plants: result.data || [],
            pagination: result.pagination || {},
            filters: { search, family, country },
            page: 'plants'
        });
    } catch (error) {
        req.flash('error', error.message);
        res.render('plants/index', {
            title: 'Especímenes - Herbario UTPL',
            plants: [],
            pagination: {},
            filters: {},
            page: 'plants'
        });
    }
});

// Formulario crear
router.get('/new', (req, res) => {
    res.render('plants/form', {
        title: 'Nuevo Espécimen - Herbario UTPL',
        plant: null,
        isEdit: false,
        page: 'plants',
        messages: req.flash()
    });
});

// Crear planta
router.post('/', upload.array('images', 5), async (req, res) => {
    try {
        // Crear FormData para enviar al backend
        const formData = new FormData();
        
        // Campos de identificación básicos
        const basicFields = [
            'catalogNumber', 'recordedBy', 'identifiedBy', 'eventDate'
        ];
        
        basicFields.forEach(field => {
            if (req.body[field]) {
                formData.append(field, req.body[field]);
            }
        });

        // Campos de ubicación
        const locationFields = [
            'country', 'stateProvince', 'locality', 'habitat',
            'verbatimElevation', 'decimalLatitude', 'decimalLongitude'
        ];
        
        locationFields.forEach(field => {
            if (req.body[field]) {
                formData.append(field, req.body[field]);
            }
        });

        // **IMPORTANTE: Campos de taxonomía como objeto anidado**
        const taxonomy = {
            family: req.body.family,
            genus: req.body.genus,
            specificEpithet: req.body.specificEpithet || '',
            scientificName: req.body.scientificName,
            scientificNameAuthorship: req.body.scientificNameAuthorship || ''
        };
        
        // Enviar taxonomía como JSON string
        formData.append('taxonomy', JSON.stringify(taxonomy));

        // Agregar imágenes si existen
        if (req.files && req.files.length > 0) {
            req.files.forEach((file) => {
                formData.append('images', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype
                });
            });
        }

        // Enviar al backend
        await axios.post(`${API_BASE_URL}/plants`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${req.session.token}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        req.flash('success', 'Espécimen creado exitosamente');
        res.redirect('/plants');
    } catch (error) {
        console.error('Error creating plant:', error.response?.data || error.message);
        req.flash('error', error.response?.data?.message || 'Error al crear el espécimen');
        res.redirect('/plants/new');
    }
});

// Ver detalle
router.get('/:id', async (req, res) => {
    try {
        const result = await plantsAPI.getById(req.session.token, req.params.id);
        
        res.render('plants/detail', {
            title: 'Detalle Espécimen - Herbario UTPL',
            plant: result.data?.plant,
            page: 'plants'
        });
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/plants');
    }
});

// Formulario editar
router.get('/:id/edit', async (req, res) => {
    try {
        const result = await plantsAPI.getById(req.session.token, req.params.id);
        res.render('plants/form', {
            title: 'Editar Espécimen - Herbario UTPL',
            plant: result.data?.plant,
            isEdit: true,
            page: 'plants',
            messages: req.flash()
        });
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/plants');
    }
});

// Actualizar
router.post('/:id', upload.array('images', 5), async (req, res) => {
    try {
        // Crear FormData para enviar al backend
        const formData = new FormData();
        
        // Agregar campos de texto
        const fields = [
            'catalogNumber', 'recordedBy', 'identifiedBy', 'eventDate',
            'country', 'stateProvince', 'locality', 'habitat',
            'verbatimElevation', 'decimalLatitude', 'decimalLongitude',
            'family', 'genus', 'specificEpithet', 'scientificName', 'scientificNameAuthorship'
        ];
        
        fields.forEach(field => {
            if (req.body[field]) {
                formData.append(field, req.body[field]);
            }
        });

        // Agregar imágenes si existen
        if (req.files && req.files.length > 0) {
            req.files.forEach((file, index) => {
                formData.append('images', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype
                });
            });
        }

        // Enviar al backend
        await axios.put(`${API_BASE_URL}/plants/${req.params.id}`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${req.session.token}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        req.flash('success', 'Espécimen actualizado');
        res.redirect(`/plants/${req.params.id}`);
    } catch (error) {
        console.error('Error updating plant:', error.response?.data || error.message);
        req.flash('error', error.response?.data?.message || error.message);
        res.redirect(`/plants/${req.params.id}/edit`);
    }
});

// Eliminar
router.post('/:id/delete', async (req, res) => {
    try {
        await plantsAPI.delete(req.session.token, req.params.id);
        req.flash('success', 'Espécimen eliminado');
        res.redirect('/plants');
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/plants');
    }
});

module.exports = router;
