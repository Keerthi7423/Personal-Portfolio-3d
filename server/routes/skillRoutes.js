const express = require('express');
const router = express.Router();
const {
    getSkills,
    getSkillById,
    createSkill,
    updateSkill,
    deleteSkill
} = require('../controllers/skillController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(getSkills)               // Public
    .post(protect, createSkill);   // Protected!

router.route('/:id')
    .get(getSkillById)            // Public
    .put(protect, updateSkill)     // Protected!
    .delete(protect, deleteSkill); // Protected!

module.exports = router;