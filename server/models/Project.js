const mongoose = require('mongoose');
const slugify = require('slugify');

const ProjectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please provide a project title'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters']
        },
        slug: {
            type: String,
            unique: true,
            index: true
        },
        shortDescription: {
            type: String,
            required: [true, 'Please provide a short description'],
            maxlength: [250, 'Short description cannot exceed 250 characters']
        },
        longDescription: {
            type: String,
            default: ''
        },
        techStack: {
            type: [String],
            default: []
        },
        images: [
            {
                url: { type: String, required: true },
                publicId: { type: String, default: '' }
            }
        ],
        liveUrl: {
            type: String,
            default: ''
        },
        githubUrl: {
            type: String,
            default: ''
        },
        featured: {
            type: Boolean,
            default: false
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

// Pre-save hook: Automatically generate slug from title before saving
ProjectSchema.pre('save', function (next) {
    if (this.isModified('title')) {
        this.slug = slugify(this.title, { lower: true, strict: true });
    }
    // next();
});

module.exports = mongoose.model('Project', ProjectSchema);