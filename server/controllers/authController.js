const Admin = require('../models/Admin');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Helper: Generate token, create httpOnly cookie, and send response
const sendTokenResponse = (admin, statusCode, res) => {
    const token = admin.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            admin: {
                id: admin._id,
                email: admin.email
            }
        });
};

// @desc    Register Admin (One-time only, then auto-disables)
// @route   POST /api/auth/register
// @access  Public (Locks after 1st user)
const register = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse('Please provide both email and password', 400));
    }

    // Security Check: Lock registration if an admin already exists
    const adminExists = await Admin.countDocuments();
    if (adminExists > 0) {
        return next(
            new ErrorResponse(
                'Registration is disabled. Admin account already exists.',
                403
            )
        );
    }

    const admin = await Admin.create({
        email,
        password
    });

    sendTokenResponse(admin, 201, res);
});

// @desc    Login Admin
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate presence
    if (!email || !password) {
        return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for admin (explicitly select +password)
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    sendTokenResponse(admin, 200, res);
});

module.exports = {
    register,
    login
};