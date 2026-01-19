const { authMiddleware } = require('./authMiddleware');
const { roleMiddleware, isAdmin, canCatalog, canCurate } = require('./roleMiddleware');
const { ApiError, notFoundHandler, errorHandler, asyncHandler } = require('./errorHandler');
const { upload, processImages, deleteImageFile, UPLOAD_DIR } = require('./uploadMiddleware');

// Alias para compatibilidad
const authenticate = authMiddleware;
const authorize = roleMiddleware;

module.exports = {
    authMiddleware,
    authenticate,
    roleMiddleware,
    authorize,
    isAdmin,
    canCatalog,
    canCurate,
    ApiError,
    notFoundHandler,
    errorHandler,
    asyncHandler,
    upload,
    processImages,
    deleteImageFile,
    UPLOAD_DIR
};
