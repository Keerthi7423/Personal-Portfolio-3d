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

    if (!email || !password) {
        return next(new ErrorResponse('Please provide an email and password', 400));
    }

    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    sendTokenResponse(admin, 200, res);
});

// @desc    Get currently logged in admin
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
    const admin = await Admin.findById(req.admin.id);

    res.status(200).json({
        success: true,
        data: admin
    });
});

// @desc    Log out admin / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // Expire in 10s
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
        data: {}
    });
});

module.exports = {
    register,
    login,
    getMe,
    logout
};