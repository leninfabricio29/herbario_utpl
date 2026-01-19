/**
 * Plant Public Controller - Acceso QR sin autenticación
 */
const { PlantRecord } = require('../models');
const { asyncHandler } = require('../middlewares');

const getPlantByOccurrenceID = asyncHandler(async (req, res) => {
    const { occurrenceID } = req.params;
    const plant = await PlantRecord.findByOccurrenceID(occurrenceID);

    if (!plant) {
        return res.status(404).json({
            success: false,
            message: 'Espécimen no encontrado'
        });
    }

    res.json({
        success: true,
        data: {
            specimen: plant.toPublicJSON(),
            accessedAt: new Date().toISOString(),
            publicAccess: true
        }
    });
});

const getPublicPlantsList = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, family, genus, country } = req.query;
    
    const filter = { isDeleted: false };
    if (family) filter['taxonomy.family'] = new RegExp(family, 'i');
    if (genus) filter['taxonomy.genus'] = new RegExp(genus, 'i');
    if (country) filter.country = new RegExp(country, 'i');

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [plants, total] = await Promise.all([
        PlantRecord.find(filter)
            .select('occurrenceID catalogNumber taxonomy.scientificName taxonomy.family country stateProvince publicUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Math.min(parseInt(limit), 50)),
        PlantRecord.countDocuments(filter)
    ]);

    res.json({
        success: true,
        data: { specimens: plants },
        pagination: { page: parseInt(page), total, totalPages: Math.ceil(total / parseInt(limit)) }
    });
});

const getPublicFamilies = asyncHandler(async (req, res) => {
    const families = await PlantRecord.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$taxonomy.family', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, data: { families } });
});

const getPublicStats = asyncHandler(async (req, res) => {
    const [total, families, genera] = await Promise.all([
        PlantRecord.countDocuments({ isDeleted: false }),
        PlantRecord.distinct('taxonomy.family', { isDeleted: false }),
        PlantRecord.distinct('taxonomy.genus', { isDeleted: false })
    ]);

    res.json({
        success: true,
        data: {
            collection: 'Herbario UTPL',
            statistics: { totalSpecimens: total, totalFamilies: families.length, totalGenera: genera.length }
        }
    });
});

module.exports = { getPlantByOccurrenceID, getPublicPlantsList, getPublicFamilies, getPublicStats };
