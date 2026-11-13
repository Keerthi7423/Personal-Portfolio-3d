const Skill = require('../models/Skill');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all skills (supports ?category=Frontend)
// @route   GET /api/skills
// @access  Public
const getSkills = asyncHandler(async (req, res, next) => {
    const query = {};
    if (req.query.category) {
        query.category = req.query.category;
    }

    // Sort by custom order, then alphabetically by name
    const skills = await Skill.find(query).sort({ order: 1, name: 1 });

    res.status(200).json({
        success: true,
        count: skills.length,
        data: skills
    });
});

// @desc    Get single skill by ID
// @route   GET /api/skills/:id
// @access  Public
const getSkillById = asyncHandler(async (req, res, next) => {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
        return next(
            new ErrorResponse(`Skill not found with id: ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: skill
    });
});

// @desc    Create a new skill
// @route   POST /api/skills
// @access  Admin (Private)
const createSkill = asyncHandler(async (req, res, next) => {
    const skill = await Skill.create(req.body);

    res.status(201).json({
        success: true,
        data: skill
    });
});

// @desc    Update a skill by ID
// @route   PUT /api/skills/:id
// @access  Admin (Private)
const updateSkill = asyncHandler(async (req, res, next) => {
    let skill = await Skill.findById(req.params.id);

    if (!skill) {
        return next(
            new ErrorResponse(`Skill not found with id: ${req.params.id}`, 404)
        );
    }

    skill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: skill
    });
});

// @desc    Delete a skill by ID
// @route   DELETE /api/skills/:id
// @access  Admin (Private)
const deleteSkill = asyncHandler(async (req, res, next) => {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
        return next(
            new ErrorResponse(`Skill not found with id: ${req.params.id}`, 404)
        );
    }

    await skill.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Skill deleted successfully',
        data: {}
    });
});

module.exports = {
    getSkills,
    getSkillById,
    createSkill,
    updateSkill,
    deleteSkill
};