const express = require('express');
const router = express.Router();
const {
    getExperience,
    getExperienceById,
    createExperience,
    updateExperience,
    deleteExperience
} = require('../controllers/experienceController');
const { protect } = require('../middleware/auth');

// /api/experience
router.route('/')
    .get(getExperience)               // Public
    .post(protect, createExperience);  // Protected!

// /api/experience/:id
router.route('/:id')
    .get(getExperienceById)           // Public
    .put(protect, updateExperience)    // Protected!
    .delete(protect, deleteExperience);// Protected!

module.exports = router;