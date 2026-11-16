const express = require('express');
const router = express.Router();
const {
    getExperience,
    getExperienceById,
    createExperience,
    updateExperience,
    deleteExperience
} = require('../controllers/experienceController');

// /api/experience
router.route('/')
    .get(getExperience)
    .post(createExperience);

// /api/experience/:id
router.route('/:id')
    .get(getExperienceById)
    .put(updateExperience)
    .delete(deleteExperience);

module.exports = router;