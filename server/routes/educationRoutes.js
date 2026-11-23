const express = require('express');
const router = express.Router();
const {
    getEducation,
    getEducationById,
    createEducation,
    updateEducation,
    deleteEducation
} = require('../controllers/educationController');
const { protect } = require('../middleware/auth');

// /api/education
router.route('/')
    .get(getEducation)               // Public
    .post(protect, createEducation);  // Protected!

// /api/education/:id
router.route('/:id')
    .get(getEducationById)           // Public
    .put(protect, updateEducation)    // Protected!
    .delete(protect, deleteEducation);// Protected!

module.exports = router;