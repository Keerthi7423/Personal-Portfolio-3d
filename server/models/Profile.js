const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide your name'],
            trim: true,
            default: 'Keerthi Kumar V'
        },
        title: {
            type: String,
            required: [true, 'Please provide your title'],
            trim: true,
            default: 'Full-Stack MERN Developer'
        },
        tagline: {
            type: String,
            default: "I don't follow trends. I rule the stack.",
            trim: true
        },
        bio: {
            type: String,
            required: [true, 'Please provide a bio'],
            trim: true
        },
        photoUrl: {
            type: String,
            default: ''
        },
        resumeUrl: {
            type: String,
            default: ''
        },
        location: {
            type: String,
            default: ''
        },
        email: {
            type: String,
            required: [true, 'Please provide a contact email'],
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            default: ''
        },
        socials: {
            github: { type: String, default: '' },
            linkedin: { type: String, default: '' },
            twitter: { type: String, default: '' },
            leetcode: { type: String, default: '' }
        },
        yearsOfExperience: {
            type: Number,
            default: 1
        },
        stats: [
            {
                label: { type: String, required: true },
                value: { type: String, required: true }
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Profile', ProfileSchema);