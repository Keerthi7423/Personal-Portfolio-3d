const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide your name'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters']
        },
        email: {
            type: String,
            required: [true, 'Please provide an email address'],
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address'
            ],
            trim: true,
            lowercase: true
        },
        subject: {
            type: String,
            default: 'General Inquiry',
            trim: true,
            maxlength: [150, 'Subject cannot exceed 150 characters']
        },
        message: {
            type: String,
            required: [true, 'Please provide a message'],
            trim: true,
            maxlength: [2000, 'Message cannot exceed 2000 characters']
        },
        read: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Message', MessageSchema);