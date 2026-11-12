const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log for debugging
    console.error(`💥 Error: ${err.message}`);

    // Mongoose Bad ObjectId (CastError) -> e.g. /api/projects/badid123
    if (err.name === 'CastError') {
        const message = `Resource not found with id: ${err.value}`;
        error = new ErrorResponse(message, 404);
    }

    // Mongoose Duplicate Key Error (11000)
    if (err.code === 11000) {
        const message = 'Duplicate field value entered. A record with that identifier already exists.';
        error = new ErrorResponse(message, 400);
    }

    // Mongoose Validation Error (missing required fields)
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message);
        error = new ErrorResponse(message, 400);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal Server Error'
    });
};

module.exports = errorHandler;