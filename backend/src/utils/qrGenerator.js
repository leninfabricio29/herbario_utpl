/**
 * QR Generator
 */
const QRCode = require('qrcode');

const generatePlantQR = async (plant) => {
    // Seleccionar solo los campos esenciales
    const img = plant.images && plant.images.length > 0
        ? (plant.images[0].url || plant.images[0].thumbnailUrl || plant.images[0].base64 || plant.images[0].thumbnailBase64)
        : null;
    const qrData = {
        url: plant.publicUrl,
        catalogNumber: plant.catalogNumber,
        scientificName: plant.taxonomy?.scientificName,
        family: plant.taxonomy?.family,
        locality: plant.locality,
        recordedBy: plant.recordedBy,
        image: img
    };
    const qrContent = JSON.stringify(qrData);
    const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
        width: 400,
        margin: 2,
        color: { dark: '#2d5016', light: '#ffffff' }
    });
    return { qrCodeDataUrl };
};

module.exports = { generatePlantQR };
