const mongoose = require('mongoose');

const EducationSchema = new mongoose.Schema(
    {
        institution: {
            type: String,
            required: [true, 'Please provide an institution/college name'],
            trim: true
        },
        degree: {
            type: String,
            required: [true, 'Please provide your degree or certification name'],
            trim: true
        },
        startYear: {
            type: String,
            required: [true, 'Please provide the start year']
        },
        endYear: {
            type: String,
            default: ''
        },
        grade: {
            type: String,
            default: ''
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

module.exports = mongoose.model('Education', EducationSchema);