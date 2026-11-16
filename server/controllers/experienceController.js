const Experience = require('../models/Experience');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all experience entries
// @route   GET /api/experience
// @access  Public
const getExperience = asyncHandler(async (req, res, next) => {
    const experiences = await Experience.find().sort({ order: 1, createdAt: -1 });

    res.status(200).json({
        success: true,
        count: experiences.length,
        data: experiences
    });
});

// @desc    Get single experience by ID
// @route   GET /api/experience/:id
// @access  Public
const getExperienceById = asyncHandler(async (req, res, next) => {
    const experience = await Experience.findById(req.params.id);

    if (!experience) {
        return next(
            new ErrorResponse(`Experience not found with id: ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: experience
    });
});

// @desc    Create new experience entry
// @route   POST /api/experience
// @access  Admin (Private)
const createExperience = asyncHandler(async (req, res, next) => {
    const experience = await Experience.create(req.body);

    res.status(201).json({
        success: true,
        data: experience
    });
});

// @desc    Update experience entry
// @route   PUT /api/experience/:id
// @access  Admin (Private)
const updateExperience = asyncHandler(async (req, res, next) => {
    let experience = await Experience.findById(req.params.id);

    if (!experience) {
        return next(
            new ErrorResponse(`Experience not found with id: ${req.params.id}`, 404)
        );
    }

    experience = await Experience.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: experience
    });
});

// @desc    Delete experience entry
// @route   DELETE /api/experience/:id
// @access  Admin (Private)
const deleteExperience = asyncHandler(async (req, res, next) => {
    const experience = await Experience.findById(req.params.id);

    if (!experience) {
        return next(
            new ErrorResponse(`Experience not found with id: ${req.params.id}`, 404)
        );
    }

    await experience.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Experience entry deleted successfully',
        data: {}
    });
});

module.exports = {
    getExperience,
    getExperienceById,
    createExperience,
    updateExperience,
    deleteExperience
};