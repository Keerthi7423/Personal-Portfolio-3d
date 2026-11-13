const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a skill name'],
            unique: true,
            trim: true,
            maxlength: [50, 'Skill name cannot exceed 50 characters']
        },
        category: {
            type: String,
            required: [true, 'Please specify a category'],
            enum: {
                values: ['Frontend', 'Backend', 'Database', 'Tools'],
                message: '{VALUE} is not a valid category. Allowed: Frontend, Backend, Database, Tools'
            }
        },
        level: {
            type: Number,
            min: [0, 'Level must be at least 0'],
            max: [100, 'Level cannot exceed 100'],
            default: 80
        },
        icon: {
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

module.exports = mongoose.model('Skill', SkillSchema);