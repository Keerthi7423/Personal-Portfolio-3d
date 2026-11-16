const express = require('express');
const router = express.Router();
const {
    getMessages,
    createMessage,
    toggleMessageRead,
    deleteMessage
} = require('../controllers/messageController');

// /api/messages
router.route('/')
    .get(getMessages)
    .post(createMessage);

// /api/messages/:id/read (Toggle read status)
router.route('/:id/read')
    .put(toggleMessageRead);

// /api/messages/:id
router.route('/:id')
    .delete(deleteMessage);

module.exports = router;