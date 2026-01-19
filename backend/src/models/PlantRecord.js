/**
 * PlantRecord Model (Occurrence - Darwin Core)
 * Modelo completo para BD-HUTPL.csv
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Sub-esquema de Taxonomía
const TaxonomySchema = new mongoose.Schema({
    kingdom: { type: String, trim: true, default: 'Plantae' },
    phylum: { type: String, trim: true },
    class: { type: String, trim: true },
    order: { type: String, trim: true },
    family: { type: String, trim: true, required: true },
    genus: { type: String, trim: true, required: true },
    specificEpithet: { type: String, trim: true },
    infraspecificEpithet: { type: String, trim: true },
    scientificName: { type: String, trim: true, required: true },
    verbatimScientificName: { type: String, trim: true },
    scientificNameAuthorship: { type: String, trim: true },
    identificationQualifier: { type: String, trim: true },
    verbatimTaxonRank: { type: String, trim: true },
    taxonRank: { type: String, trim: true, default: 'species' },
    nomenclaturalCode: { type: String, trim: true, default: 'ICN' },
    taxonID: { type: String, trim: true },
    vernacularName: { type: String, trim: true },
    taxonomicStatus: { type: String, trim: true },
    synonym: { type: String, trim: true },
    previousIdentifications: { type: String, trim: true }
}, { _id: false });

// Sub-esquema de Permisos
const PermitSchema = new mongoose.Schema({
    permitBy: { type: String, trim: true },
    permitName: { type: String, trim: true },
    permitType: { type: String, trim: true },
    permitStatus: { type: String, trim: true },
    permitStatusQualifier: { type: String, trim: true },
    permitURI: { type: String, trim: true },
    permitText: { type: String, trim: true }
}, { _id: false });

// Sub-esquema de Imágenes
const ImageSchema = new mongoose.Schema({
    id: { type: String, required: true },
    filename: { type: String },
    thumbnailFilename: { type: String },
    originalName: { type: String },
    mimetype: { type: String, default: 'image/webp' },
    size: { type: Number },
    thumbnailSize: { type: Number },
    originalSize: { type: Number },
    originalWidth: { type: Number },
    originalHeight: { type: Number },
    compressionRatio: { type: String },
    url: { type: String },
    thumbnailUrl: { type: String },
    base64: { type: String },
    thumbnailBase64: { type: String },
    description: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

// Esquema Principal
const PlantRecordSchema = new mongoose.Schema({
    // IDENTIFICACIÓN
    occurrenceID: { type: String, unique: true, required: true, default: () => uuidv4(), index: true },
    catalogNumber: { type: String, trim: true, required: true, index: true },
    otherCatalogNumbers: { type: String, trim: true },
    recordNumber: { type: String, trim: true },
    basisOfRecord: { type: String, trim: true, default: 'PreservedSpecimen' },
    type: { type: String, trim: true, default: 'PhysicalObject' },
    informationWithheld: { type: String, trim: true },

    // EVENTO DE RECOLECCIÓN
    recordedBy: { type: String, trim: true, required: true },
    identifiedBy: { type: String, trim: true },
    herbAffiliation: { type: String, trim: true },
    catalogerName: { type: String, trim: true },
    catalogYear: { type: String, trim: true },
    dateIdentified: { type: String, trim: true },
    verbatimEventDate: { type: String, trim: true },
    eventDate: { type: String, trim: true },
    year: { type: String, trim: true },
    month: { type: String, trim: true },
    day: { type: String, trim: true },

    // UBICACIÓN
    continent: { type: String, trim: true, default: 'South America' },
    country: { type: String, trim: true, default: 'Ecuador' },
    countryCode: { type: String, trim: true, default: 'EC' },
    stateProvince: { type: String, trim: true },
    county: { type: String, trim: true },
    municipality: { type: String, trim: true },
    locality: { type: String, trim: true, required: true },
    verbatimLocality: { type: String, trim: true },
    habitat: { type: String, trim: true },
    verbatimElevation: { type: String, trim: true },
    minimumElevationInMeters: { type: String, trim: true },
    maximumElevationInMeters: { type: String, trim: true },
    verbatimCoordinateSystem: { type: String, trim: true },
    verbatimCoordinates: { type: String, trim: true },
    decimalLatitude: { type: String, trim: true },
    decimalLongitude: { type: String, trim: true },
    geodeticDatum: { type: String, trim: true, default: 'WGS84' },
    georeferenceRemarks: { type: String, trim: true },

    // TAXONOMÍA
    taxonomy: { type: TaxonomySchema, required: true },

    // INSTITUCIÓN Y COLECCIÓN
    institutionCode: { type: String, trim: true, default: 'UTPL' },
    institutionID: { type: String, trim: true },
    collectionCode: { type: String, trim: true },
    collectionID: { type: String, trim: true },
    datasetID: { type: String, trim: true },
    datasetName: { type: String, trim: true },
    ownerInstitutionCode: { type: String, trim: true },

    // PERMISOS
    permit: { type: PermitSchema },

    // METADATOS
    language: { type: String, trim: true, default: 'es' },
    license: { type: String, trim: true, default: 'https://creativecommons.org/licenses/by-nc/4.0/' },
    rightsHolder: { type: String, trim: true, default: 'Universidad Tecnica Particular de Loja' },
    accessRights: { type: String, trim: true },
    associatedReferences: { type: String, trim: true },

    // OBSERVACIONES
    occurrenceRemarks: { type: String, trim: true },
    occurrenceStatus: { type: String, trim: true, default: 'present' },
    organismQuantity: { type: String, trim: true },
    organismQuantityType: { type: String, trim: true },
    lifeStage: { type: String, trim: true },
    growthHabit: { type: String, trim: true },
    establishmentMeans: { type: String, trim: true },
    preparations: { type: String, trim: true },
    disposition: { type: String, trim: true },
    duplicateLocation: { type: String, trim: true },
    associatedSequences: { type: String, trim: true },
    typeStatus: { type: String, trim: true },

    // USOS
    useCategory: { type: String, trim: true },
    verbatimUse: { type: String, trim: true },

    // CAMPOS UTPL/MAE
    mobilizationCode: { type: String, trim: true },
    collectionCodeMAE: { type: String, trim: true },
    depositCode: { type: String, trim: true },
    observation: { type: String, trim: true },

    // SISTEMA
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    importedFromCSV: { type: Boolean, default: false },
    importedAt: Date,

    // IMÁGENES
    images: [ImageSchema],

    // QR
    publicUrl: { type: String, trim: true },
    qrCodeDataUrl: { type: String }
}, {
    timestamps: true,
    versionKey: false
});

// Índices
PlantRecordSchema.index({ 'taxonomy.family': 1 });
PlantRecordSchema.index({ 'taxonomy.genus': 1 });
PlantRecordSchema.index({ 'taxonomy.scientificName': 1 });
PlantRecordSchema.index({ country: 1, stateProvince: 1 });

// Pre-save
PlantRecordSchema.pre('save', function(next) {
    if (!this.occurrenceID) {
        this.occurrenceID = uuidv4();
    }
    const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
    // URL pública debe ser la API
    this.publicUrl = `${baseUrl}/public/specimen/${this.occurrenceID}`;
    // Si usas generación de QR aquí, asegúrate que apunte a publicUrl
    next();
});

// Métodos
PlantRecordSchema.methods.toPublicJSON = function() {
    return {
        occurrenceID: this.occurrenceID,
        catalogNumber: this.catalogNumber,
        taxonomy: this.taxonomy,
        recordedBy: this.recordedBy,
        identifiedBy: this.identifiedBy,
        eventDate: this.eventDate,
        country: this.country,
        stateProvince: this.stateProvince,
        locality: this.locality,
        decimalLatitude: this.decimalLatitude,
        decimalLongitude: this.decimalLongitude,
        institutionCode: this.institutionCode,
        license: this.license,
        rightsHolder: this.rightsHolder,
        images: this.images || [],
    };
};

PlantRecordSchema.methods.softDelete = async function(userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    return this.save();
};

PlantRecordSchema.statics.findByOccurrenceID = function(occurrenceID) {
    return this.findOne({ occurrenceID, isDeleted: false });
};

module.exports = mongoose.model('PlantRecord', PlantRecordSchema);
