const express = require('express');
const router = express.Router();
const {
    getMessages,
    createMessage,
    toggleMessageRead,
    deleteMessage
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { messageLimiter } = require('../middleware/rateLimit');

router.route('/')
    .get(protect, getMessages)
    .post(messageLimiter, createMessage); // Protect contact form against spam!

router.route('/:id/read')
    .put(protect, toggleMessageRead);

router.route('/:id')
    .delete(protect, deleteMessage);

module.exports = router;