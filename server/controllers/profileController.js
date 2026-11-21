const Profile = require('../models/Profile');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get portfolio profile (About / Hero data)
// @route   GET /api/profile
// @access  Public
const getProfile = asyncHandler(async (req, res, next) => {
    let profile = await Profile.findOne();

    if (!profile) {
        // Return a default profile if none has been saved yet
        profile = await Profile.create({
            name: 'Keerthi Kumar V',
            title: 'Full-Stack MERN Developer',
            tagline: "I don't follow trends. I rule the stack.",
            bio: 'Full-stack developer specializing in modern web applications, high-performance APIs, and interactive 3D experiences.',
            email: 'contact@keerthi.dev',
            stats: [
                { label: 'Projects Completed', value: '10+' },
                { label: 'Core Technologies', value: '15+' }
            ]
        });
    }

    res.status(200).json({
        success: true,
        data: profile
    });
});

// @desc    Update or initialize profile
// @route   PUT /api/profile
// @access  Admin (Private)
const updateProfile = asyncHandler(async (req, res, next) => {
    // Atomically find existing profile and update, or create if not found
    const profile = await Profile.findOneAndUpdate(
        {},
        req.body,
        {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true
        }
    );

    res.status(200).json({
        success: true,
        data: profile
    });
});

module.exports = {
    getProfile,
    updateProfile
};