const Message = require('../models/Message');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all messages (Admin inbox with pagination & unread count)
// @route   GET /api/messages
// @access  Admin (Private)
const getMessages = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = {};
    if (req.query.read !== undefined) {
        query.read = req.query.read === 'true';
    }

    const total = await Message.countDocuments(query);
    const unreadCount = await Message.countDocuments({ read: false });

    const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);

    res.status(200).json({
        success: true,
        total,
        unreadCount,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        },
        data: messages
    });
});

// @desc    Create new message (Contact form submission)
// @route   POST /api/messages
// @access  Public
const createMessage = asyncHandler(async (req, res, next) => {
    const { name, email, subject, message } = req.body;

    const newMessage = await Message.create({
        name,
        email,
        subject,
        message
    });

    res.status(201).json({
        success: true,
        message: 'Message sent successfully! Thank you for reaching out.',
        data: newMessage
    });
});

// @desc    Toggle message read status
// @route   PUT /api/messages/:id/read
// @access  Admin (Private)
const toggleMessageRead = asyncHandler(async (req, res, next) => {
    let message = await Message.findById(req.params.id);

    if (!message) {
        return next(
            new ErrorResponse(`Message not found with id: ${req.params.id}`, 404)
        );
    }

    message.read = req.body?.read !== undefined ? req.body.read : !message.read;
    await message.save();

    res.status(200).json({
        success: true,
        data: message
    });
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Admin (Private)
const deleteMessage = asyncHandler(async (req, res, next) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        return next(
            new ErrorResponse(`Message not found with id: ${req.params.id}`, 404)
        );
    }

    await message.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
        data: {}
    });
});

module.exports = {
    getMessages,
    createMessage,
    toggleMessageRead,
    deleteMessage
};