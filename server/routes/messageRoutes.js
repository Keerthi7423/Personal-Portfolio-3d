const express = require('express');
const router = express.Router();
const {
    getMessages,
    createMessage,
    toggleMessageRead,
    deleteMessage
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getMessages)     // Protected (Admin only reads inbox)
    .post(createMessage);          // Public (Recruiters send messages)

router.route('/:id/read')
    .put(protect, toggleMessageRead); // Protected

router.route('/:id')
    .delete(protect, deleteMessage);  // Protected

module.exports = router;