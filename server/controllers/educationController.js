const Education = require('../models/Education');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all education entries
// @route   GET /api/education
// @access  Public
const getEducation = asyncHandler(async (req, res, next) => {
    const educations = await Education.find().sort({ order: 1, createdAt: -1 });

    res.status(200).json({
        success: true,
        count: educations.length,
        data: educations
    });
});

// @desc    Get single education entry by ID
// @route   GET /api/education/:id
// @access  Public
const getEducationById = asyncHandler(async (req, res, next) => {
    const education = await Education.findById(req.params.id);

    if (!education) {
        return next(
            new ErrorResponse(`Education not found with id: ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: education
    });
});

// @desc    Create new education entry
// @route   POST /api/education
// @access  Admin (Private)
const createEducation = asyncHandler(async (req, res, next) => {
    const education = await Education.create(req.body);

    res.status(201).json({
        success: true,
        data: education
    });
});

// @desc    Update education entry
// @route   PUT /api/education/:id
// @access  Admin (Private)
const updateEducation = asyncHandler(async (req, res, next) => {
    let education = await Education.findById(req.params.id);

    if (!education) {
        return next(
            new ErrorResponse(`Education not found with id: ${req.params.id}`, 404)
        );
    }

    education = await Education.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: education
    });
});

// @desc    Delete education entry
// @route   DELETE /api/education/:id
// @access  Admin (Private)
const deleteEducation = asyncHandler(async (req, res, next) => {
    const education = await Education.findById(req.params.id);

    if (!education) {
        return next(
            new ErrorResponse(`Education not found with id: ${req.params.id}`, 404)
        );
    }

    await education.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Education entry deleted successfully',
        data: {}
    });
});

module.exports = {
    getEducation,
    getEducationById,
    createEducation,
    updateEducation,
    deleteEducation
};