/**
 * Error Handler Middleware
 */

class ApiError extends Error {
    constructor(statusCode, message, errorCode = 'API_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }
}

const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
        error: 'NOT_FOUND'
    });
};

const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Error interno del servidor';

    // Errores de Mongoose
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Error de validación';
    }

    if (err.code === 11000) {
        statusCode = 400;
        message = 'Registro duplicado';
    }

    res.status(statusCode).json({
        success: false,
        message,
        error: err.errorCode || 'ERROR'
    });
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { ApiError, notFoundHandler, errorHandler, asyncHandler };
