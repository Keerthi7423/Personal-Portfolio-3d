const mongoose = require('mongoose');

const ExperienceSchema = new mongoose.Schema(
    {
        company: {
            type: String,
            required: [true, 'Please provide a company name'],
            trim: true
        },
        role: {
            type: String,
            required: [true, 'Please provide your role/title'],
            trim: true
        },
        startDate: {
            type: String,
            required: [true, 'Please provide a start date']
        },
        endDate: {
            type: String,
            default: ''
        },
        current: {
            type: Boolean,
            default: false
        },
        description: {
            type: [String],
            default: []
        },
        techUsed: {
            type: [String],
            default: []
        },
        order: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Experience', ExperienceSchema);