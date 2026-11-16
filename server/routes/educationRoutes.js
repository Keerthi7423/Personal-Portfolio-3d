const express = require('express');
const router = express.Router();
const {
    getEducation,
    getEducationById,
    createEducation,
    updateEducation,
    deleteEducation
} = require('../controllers/educationController');

// /api/education
router.route('/')
    .get(getEducation)
    .post(createEducation);

// /api/education/:id
router.route('/:id')
    .get(getEducationById)
    .put(updateEducation)
    .delete(deleteEducation);

module.exports = router;