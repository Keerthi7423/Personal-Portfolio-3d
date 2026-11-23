const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProjectBySlug,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(getProjects)               // Public
    .post(protect, createProject);   // Protected!

router.route('/:slug')
    .get(getProjectBySlug);         // Public

router.route('/:id')
    .put(protect, updateProject)     // Protected!
    .delete(protect, deleteProject); // Protected!

module.exports = router;