const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProjectBySlug,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/projectController');

// /api/projects
router.route('/')
    .get(getProjects)
    .post(createProject);

// /api/projects/:slug (Public details by slug)
router.route('/:slug')
    .get(getProjectBySlug);

// /api/projects/:id (Admin update/delete by ID)
router.route('/:id')
    .put(updateProject)
    .delete(deleteProject);

module.exports = router;