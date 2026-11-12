const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const slugify = require('slugify');

// @desc    Get all projects (supports ?featured=true)
// @route   GET /api/projects
// @access  Public
const getProjects = asyncHandler(async (req, res, next) => {
    const query = {};
    if (req.query.featured === 'true') {
        query.featured = true;
    }

    const projects = await Project.find(query).sort({ order: 1, createdAt: -1 });

    res.status(200).json({
        success: true,
        count: projects.length,
        data: projects
    });
});

// @desc    Get single project by slug
// @route   GET /api/projects/:slug
// @access  Public
const getProjectBySlug = asyncHandler(async (req, res, next) => {
    const project = await Project.findOne({ slug: req.params.slug });

    if (!project) {
        return next(
            new ErrorResponse(`Project not found with slug: ${req.params.slug}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: project
    });
});

// @desc    Create a new project
// @route   POST /api/projects
// @access  Admin (Private)
const createProject = asyncHandler(async (req, res, next) => {
    const project = await Project.create(req.body);

    res.status(201).json({
        success: true,
        data: project
    });
});

// @desc    Update project by ID
// @route   PUT /api/projects/:id
// @access  Admin (Private)
const updateProject = asyncHandler(async (req, res, next) => {
    let project = await Project.findById(req.params.id);

    if (!project) {
        return next(
            new ErrorResponse(`Project not found with id: ${req.params.id}`, 404)
        );
    }

    // Regenerate slug if title changed
    if (req.body.title && req.body.title !== project.title) {
        req.body.slug = slugify(req.body.title, { lower: true, strict: true });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: project
    });
});

// @desc    Delete project by ID
// @route   DELETE /api/projects/:id
// @access  Admin (Private)
const deleteProject = asyncHandler(async (req, res, next) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        return next(
            new ErrorResponse(`Project not found with id: ${req.params.id}`, 404)
        );
    }

    await project.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
        data: {}
    });
});

module.exports = {
    getProjects,
    getProjectBySlug,
    createProject,
    updateProject,
    deleteProject
};