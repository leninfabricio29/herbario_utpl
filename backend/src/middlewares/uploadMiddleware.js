/**
 * Upload Middleware - Multer + Sharp para optimización de imágenes
 */
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Directorio de uploads
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const UPLOAD_IMAGES_DIR = path.join(UPLOAD_DIR, 'images');

// Crear directorios si no existen
[UPLOAD_DIR, UPLOAD_IMAGES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configuración de Multer (almacenamiento temporal en memoria)
const storage = multer.memoryStorage();

// Filtro de archivos - solo imágenes
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo: JPG, PNG, WebP, GIF'), false);
    }
};

// Configuración de Multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo por archivo
        files: 5 // Máximo 5 archivos por request
    }
});

// Configuración de optimización
const IMAGE_CONFIG = {
    maxWidth: 1200,      // Ancho máximo
    maxHeight: 1200,     // Alto máximo
    quality: 80,         // Calidad JPEG/WebP (0-100)
    format: 'webp',      // Formato de salida optimizado
    thumbnail: {
        width: 300,
        height: 300,
        quality: 70
    }
};

/**
 * Procesa y optimiza una imagen
 * @param {Buffer} buffer - Buffer de la imagen
 * @param {string} originalName - Nombre original del archivo
 * @returns {Object} - Info de la imagen procesada
 */
const processImage = async (buffer, originalName) => {
    const id = uuidv4();
    const ext = '.webp';
    const filename = `${id}${ext}`;
    const thumbFilename = `${id}_thumb${ext}`;
    
    const imagePath = path.join(UPLOAD_IMAGES_DIR, filename);
    const thumbPath = path.join(UPLOAD_IMAGES_DIR, thumbFilename);

    // Obtener metadata original
    const metadata = await sharp(buffer).metadata();

    // Procesar imagen principal (redimensionar si es necesario + optimizar)
    await sharp(buffer)
        .resize(IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({ quality: IMAGE_CONFIG.quality })
        .toFile(imagePath);

    // Crear thumbnail
    await sharp(buffer)
        .resize(IMAGE_CONFIG.thumbnail.width, IMAGE_CONFIG.thumbnail.height, {
            fit: 'cover',
            position: 'center'
        })
        .webp({ quality: IMAGE_CONFIG.thumbnail.quality })
        .toFile(thumbPath);

    // Obtener tamaños finales
    const finalStats = fs.statSync(imagePath);
    const thumbStats = fs.statSync(thumbPath);

    return {
        id,
        filename,
        thumbnailFilename: thumbFilename,
        originalName,
        mimetype: 'image/webp',
        size: finalStats.size,
        thumbnailSize: thumbStats.size,
        originalSize: buffer.length,
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        compressionRatio: ((1 - finalStats.size / buffer.length) * 100).toFixed(1) + '%',
        url: `/uploads/images/${filename}`,
        thumbnailUrl: `/uploads/images/${thumbFilename}`,
        uploadedAt: new Date()
    };
};

/**
 * Convierte imagen a Base64 optimizado
 * @param {Buffer} buffer - Buffer de la imagen
 * @returns {Object} - Imagen en base64 + metadata
 */
const processImageToBase64 = async (buffer, originalName) => {
    const id = uuidv4();

    // Obtener metadata original
    const metadata = await sharp(buffer).metadata();

    // Optimizar imagen
    const optimizedBuffer = await sharp(buffer)
        .resize(IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({ quality: IMAGE_CONFIG.quality })
        .toBuffer();

    // Crear thumbnail en base64
    const thumbnailBuffer = await sharp(buffer)
        .resize(IMAGE_CONFIG.thumbnail.width, IMAGE_CONFIG.thumbnail.height, {
            fit: 'cover',
            position: 'center'
        })
        .webp({ quality: IMAGE_CONFIG.thumbnail.quality })
        .toBuffer();

    return {
        id,
        originalName,
        mimetype: 'image/webp',
        size: optimizedBuffer.length,
        originalSize: buffer.length,
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        compressionRatio: ((1 - optimizedBuffer.length / buffer.length) * 100).toFixed(1) + '%',
        base64: `data:image/webp;base64,${optimizedBuffer.toString('base64')}`,
        thumbnailBase64: `data:image/webp;base64,${thumbnailBuffer.toString('base64')}`,
        uploadedAt: new Date()
    };
};

/**
 * Middleware para procesar múltiples imágenes
 */
const processImages = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next();
    }

    try {
        const storageMode = process.env.IMAGE_STORAGE_MODE || 'file'; // 'file' o 'base64'
        const processedImages = [];

        for (const file of req.files) {
            let processed;
            if (storageMode === 'base64') {
                processed = await processImageToBase64(file.buffer, file.originalname);
            } else {
                processed = await processImage(file.buffer, file.originalname);
            }
            
            // Agregar descripción si viene en el body
            if (req.body.imageDescriptions) {
                const descriptions = Array.isArray(req.body.imageDescriptions) 
                    ? req.body.imageDescriptions 
                    : [req.body.imageDescriptions];
                processed.description = descriptions[processedImages.length] || '';
            }
            
            processedImages.push(processed);
        }

        req.processedImages = processedImages;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Elimina imagen del sistema de archivos
 */
const deleteImageFile = (filename) => {
    try {
        const imagePath = path.join(UPLOAD_IMAGES_DIR, filename);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
        // También eliminar thumbnail
        const thumbPath = path.join(UPLOAD_IMAGES_DIR, filename.replace('.webp', '_thumb.webp'));
        if (fs.existsSync(thumbPath)) {
            fs.unlinkSync(thumbPath);
        }
    } catch (error) {
        console.error('Error eliminando imagen:', error.message);
    }
};

module.exports = {
    upload,
    processImages,
    processImage,
    processImageToBase64,
    deleteImageFile,
    UPLOAD_DIR,
    UPLOAD_IMAGES_DIR,
    IMAGE_CONFIG
};
