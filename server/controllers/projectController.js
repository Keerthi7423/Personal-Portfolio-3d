const Project = require('../models/Project');

// @desc    Get all projects (supports ?featured=true)
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res) => {
    try {
        const query = {};
        if (req.query.featured === 'true') {
            query.featured = true;
        }

        // Sort by order ascending, then newest first
        const projects = await Project.find(query).sort({ order: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single project by slug
// @route   GET /api/projects/:slug
// @access  Public
const getProjectBySlug = async (req, res) => {
    try {
        const project = await Project.findOne({ slug: req.params.slug });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: `Project not found with slug: ${req.params.slug}`
            });
        }

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Admin (Private)
const createProject = async (req, res) => {
    try {
        const project = await Project.create(req.body);
        res.status(201).json({ success: true, data: project });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A project with this title or slug already exists'
            });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update project by ID
// @route   PUT /api/projects/:id
// @access  Admin (Private)
const updateProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: `Project not found with id: ${req.params.id}`
            });
        }

        if (req.body.title && req.body.title !== project.title) {
            const slugify = require('slugify');
            req.body.slug = slugify(req.body.title, { lower: true, strict: true });
        }

        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete project by ID
// @route   DELETE /api/projects/:id
// @access  Admin (Private)
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: `Project not found with id: ${req.params.id}`
            });
        }

        await project.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully',
            data: {}
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getProjects,
    getProjectBySlug,
    createProject,
    updateProject,
    deleteProject
};