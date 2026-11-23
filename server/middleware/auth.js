const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Admin = require('../models/Admin');

// Protect routes: verify JWT from cookie or Authorization header
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Check Authorization header (Bearer token)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    // 2. Check httpOnly cookies
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
        return next(
            new ErrorResponse('Not authorized to access this route', 401)
        );
    }

    try {
        // Verify token signature
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch fresh admin from DB
        req.admin = await Admin.findById(decoded.id);

        if (!req.admin) {
            return next(
                new ErrorResponse('User belonging to this token no longer exists', 401)
            );
        }

        next();
    } catch (err) {
        return next(
            new ErrorResponse('Not authorized to access this route', 401)
        );
    }
});

module.exports = { protect };