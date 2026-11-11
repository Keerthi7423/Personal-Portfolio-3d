# 📘 Day 3: Project Model, Slug Generation, & Full CRUD API

---

## 📑 Table of Contents
1. [Overview & Day 3 Goals](#1-overview--day-3-goals)
2. [MVC Architecture (Model-View-Controller)](#2-mvc-architecture-model-view-controller)
3. [The Project Data Contract (Schema Definition)](#3-the-project-data-contract-schema-definition)
4. [What is a Slug & Why Use It?](#4-what-is-a-slug--why-use-it)
5. [Step-by-Step Implementation Guide](#5-step-by-step-implementation-guide)
   - Step 1: Install `slugify`
   - Step 2: Create `server/models/Project.js`
   - Step 3: Create `server/controllers/projectController.js`
   - Step 4: Create `server/routes/projectRoutes.js`
   - Step 5: Mount Routes in `server/server.js`
6. [Line-by-Line Code Breakdown](#6-line-by-line-code-breakdown)
7. [Testing the Endpoints (Postman / Thunder Client)](#7-testing-the-endpoints-postman--thunder-client)
8. [How Companies & Enterprises Maintain This](#8-how-companies--enterprises-maintain-this)
9. [Top Interview Questions & Deep Answers](#9-top-interview-questions--deep-answers)

---

## 1. Overview & Day 3 Goals

According to your 2-month plan for **Wednesday (Week 1, Day 3)**:
> *"Build the Project model and full CRUD (controller + routes). Add slug generation."*

### Key Milestones Achieved:
- Transitioned `server/` into professional **MVC architecture** (`models/`, `controllers/`, `routes/`).
- Designed the Mongoose **`Project` Schema** with data types, defaults, and validations.
- Implemented automated **Slug Generation** using Mongoose pre-save hooks.
- Built all 5 RESTful CRUD operations:
  1. `POST /api/projects`: Create a new project (auto-generates slug).
  2. `GET /api/projects`: Fetch all projects (with optional `?featured=true` filter and sorted by `order`).
  3. `GET /api/projects/:slug`: Fetch a single project by SEO-friendly slug.
  4. `PUT /api/projects/:id`: Update an existing project by MongoDB `_id`.
  5. `DELETE /api/projects/:id`: Permanently delete a project by MongoDB `_id`.
- Mounted the modular router onto Express at `/api/projects`.

---

## 2. MVC Architecture (Model-View-Controller)

In production software engineering, code is divided into single-responsibility layers:

```
HTTP Request (Client)
        │
        ▼
[server.js] ──────────► Routes traffic to specific sub-routers
        │
        ▼
[routes/projectRoutes.js] ─► Maps HTTP methods (GET, POST, PUT, DELETE) to Controller functions
        │
        ▼
[controllers/projectController.js] ─► Business logic, validates input, talks to Database
        │
        ▼
[models/Project.js] ──► Mongoose schema rules, data structure, hooks, MongoDB operations
        │
        ▼
[MongoDB Atlas Database]
```

### Why MVC over putting everything in `server.js`?
1. **Maintainability**: When the project grows to include Skills, Experience, Education, and Messages, `server.js` stays tiny (~30-40 lines).
2. **Reusability**: Controllers can be unit tested without starting the full HTTP server.
3. **Collaboration**: Multiple developers can work on routes, models, or business logic without git merge conflicts.

---

## 3. The Project Data Contract (Schema Definition)

According to Section 5 of your plan, the `Project` model requires:
- `title` (String, required, trimmed)
- `slug` (String, unique, indexed for high-speed queries)
- `shortDescription` (String, required, brief 1-2 lines for card preview)
- `longDescription` (String, detailed markdown or text for project page)
- `techStack` (Array of Strings, e.g. `['React', 'Three.js', 'Node.js']`)
- `images` (Array of objects: `[{ url: String, publicId: String }]` for Cloudinary integration)
- `liveUrl` (String, link to live deployed app)
- `githubUrl` (String, link to source code repository)
- `featured` (Boolean, default: false — determines if shown on the Hero/Home page)
- `order` (Number, default: 0 — custom drag-and-drop sort order in admin panel)
- `timestamps` (`createdAt` and `updatedAt` managed automatically by Mongoose)

---

## 4. What is a Slug & Why Use It?

### Comparison:
- **Without Slug (raw ID)**: `https://keerthi.dev/projects/672fc10a8b417e23a9efb912`
- **With Slug**: `https://keerthi.dev/projects/doom-inspired-3d-portfolio`

### Advantages:
1. **SEO (Search Engine Optimization)**: Google, Bing, and web crawlers index keywords found in the URL.
2. **User Experience (Readability)**: Users know what the page is before clicking.
3. **Professionalism**: Recruiters immediately recognize production-grade API design.

---

## 5. Step-by-Step Implementation Guide

### Step 1: Install `slugify`
In your `server/` terminal:
```bash
npm install slugify
```

### Step 2: Create `server/models/Project.js`
Create directory `server/models/` and file `server/models/Project.js`:

```javascript
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
    next();
});

module.exports = mongoose.model('Project', ProjectSchema);
```

---

### Step 3: Create `server/controllers/projectController.js`
Create directory `server/controllers/` and file `server/controllers/projectController.js`:

```javascript
const Project = require('../models/Project');

// @desc    Get all projects (supports ?featured=true)
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res) => {
    try {
        const query = {};
        if (req.query.featured === 'true') {
            query.featured = true;
        }

        // Sort by custom order ascending, then by creation date descending
        const projects = await Project.find(query).sort({ order: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single project by slug
// @route   GET /api/projects/:slug
// @access  Public
const getProjectBySlug = async (req, res) => {
    try {
        const project = await Project.findOne({ slug: req.params.slug });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: `Project not found with slug: ${req.params.slug}`
            });
        }

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Admin (Private)
const createProject = async (req, res) => {
    try {
        const project = await Project.create(req.body);
        res.status(201).json({ success: true, data: project });
    } catch (error) {
        // Handle duplicate key error (e.g. duplicate title / slug)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A project with this title or slug already exists'
            });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update project by ID
// @route   PUT /api/projects/:id
// @access  Admin (Private)
const updateProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: `Project not found with id: ${req.params.id}`
            });
        }

        // If title is updated, ensure slug is regenerated
        if (req.body.title && req.body.title !== project.title) {
            const slugify = require('slugify');
            req.body.slug = slugify(req.body.title, { lower: true, strict: true });
        }

        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete project by ID
// @route   DELETE /api/projects/:id
// @access  Admin (Private)
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: `Project not found with id: ${req.params.id}`
            });
        }

        await project.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully',
            data: {}
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getProjects,
    getProjectBySlug,
    createProject,
    updateProject,
    deleteProject
};
```

---

### Step 4: Create `server/routes/projectRoutes.js`
Create directory `server/routes/` and file `server/routes/projectRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProjectBySlug,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/projectController');

// Route: /api/projects
router.route('/')
    .get(getProjects)
    .post(createProject);

// Route: /api/projects/:slug (Public view by slug)
router.route('/:slug')
    .get(getProjectBySlug);

// Route: /api/projects/:id (Admin update & delete by ID)
router.route('/:id')
    .put(updateProject)
    .delete(deleteProject);

module.exports = router;
```

---

### Step 5: Mount Routes in `server/server.js`

Open [`server/server.js`](file:///d:/Projects/Personal%20Portfolio/server/server.js):
1. Import `projectRoutes`:
   ```javascript
   const projectRoutes = require('./routes/projectRoutes');
   ```
2. Mount the routes under `/api/projects`:
   ```javascript
   app.use('/api/projects', projectRoutes);
   ```

---

## 6. Line-by-Line Code Breakdown

### A. Pre-save Hook in `Project.js`
```javascript
ProjectSchema.pre('save', function (next) {
    if (this.isModified('title')) {
        this.slug = slugify(this.title, { lower: true, strict: true });
    }
    next();
});
```
- `ProjectSchema.pre('save', ...)`: A Mongoose document middleware hook that intercepts the document immediately before writing to MongoDB.
- `function (next)`: We use standard `function` keyword (not arrow function `() =>`) because we need the dynamic `this` keyword to point to the current document being saved.
- `this.isModified('title')`: Optimization. Only generates a new slug if the title is new or has been changed, preventing unnecessary recalculation.
- `{ lower: true, strict: true }`: Converts to lowercase (e.g. `Doom 3D Portfolio!` becomes `doom-3d-portfolio`). `strict: true` strips punctuation and special characters (`!`, `@`, `#`).

### B. Route Chaining with `router.route()`
```javascript
router.route('/')
    .get(getProjects)
    .post(createProject);
```
- Uses Express's clean route chaining pattern instead of writing separate `router.get('/', ...)` and `router.post('/', ...)`.
- Groups operations on the exact same endpoint together.

### C. Options in `findByIdAndUpdate`
```javascript
Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
});
```
- `new: true`: Returns the modified document rather than the original document before the update.
- `runValidators: true`: By default, Mongoose update queries skip schema validations. Passing this ensures schema constraints (such as `maxlength`, `required`) are still enforced during updates.

---

## 7. Testing the Endpoints (Postman / Thunder Client)

### 1. Test POST (Create Project)
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/projects`
- **Header**: `Content-Type: application/json`
- **Body (raw JSON)**:
```json
{
  "title": "Doom 3D Portfolio",
  "shortDescription": "Dark cinematic full-stack developer portfolio with 3D mask hero and custom admin panel.",
  "techStack": ["React", "Three.js", "Node.js", "Express", "MongoDB"],
  "featured": true,
  "order": 1,
  "liveUrl": "https://keerthi.dev",
  "githubUrl": "https://github.com/Keerthi7423/Personal-Portfolio-3d"
}
```
- **Expected Status**: `201 Created`
- **Notice**: In the response, `"slug": "doom-3d-portfolio"` was automatically generated!

### 2. Test GET (Fetch all projects)
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/projects`
- **Expected Status**: `200 OK`

### 3. Test GET by Slug (Public Project Details)
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/projects/doom-3d-portfolio`
- **Expected Status**: `200 OK`

### 4. Test PUT (Update Project)
- **Method**: `PUT`
- **URL**: `http://localhost:5000/api/projects/<paste_project_id_here>`
- **Body**:
```json
{
  "featured": false
}
```
- **Expected Status**: `200 OK`

### 5. Test DELETE (Delete Project)
- **Method**: `DELETE`
- **URL**: `http://localhost:5000/api/projects/<paste_project_id_here>`
- **Expected Status**: `200 OK`

---

## 8. How Companies & Enterprises Maintain This

1. **Database Indexing (`index: true`)**:
   In `slug: { type: String, unique: true, index: true }`, creating an index is vital. Without an index, finding a project by slug requires MongoDB to scan every single document in the collection ($O(N)$ collection scan). With an index, MongoDB uses a B-Tree structure ($O(\log N)$ lookup), responding in less than 1 millisecond.
2. **Standardized Response Envelope**:
   Notice every endpoint returns a consistent JSON envelope:
   ```json
   {
     "success": true,
     "data": { ... }
   }
   ```
   Enterprise frontends rely on predictable shapes so error handlers and data fetchers don't break.
3. **Soft Delete vs Hard Delete**:
   In financial or enterprise apps, documents are rarely permanently removed (`deleteOne()`). Instead, companies use "Soft Deletes" by setting a field `isDeleted: true` or `deletedAt: new Date()` to preserve audit history. For personal portfolios, a hard delete is standard.

---

## 9. Top Interview Questions & Deep Answers

### 🟢 Junior Level

#### Q1: Why do we use `function` instead of an arrow function `() =>` in Mongoose schema hooks?
> **Answer**: Arrow functions do not bind their own `this`; they lexically capture `this` from the enclosing scope (which in Node module context is `exports`). Mongoose hooks rely on `this` pointing dynamically to the document instance being validated or saved. Using a regular `function (next)` ensures `this` refers to the document so properties like `this.title` can be accessed and modified.

#### Q2: What is the difference between HTTP Status Code 200 and 201?
> **Answer**: `200 OK` signifies standard successful HTTP requests (such as `GET` reads, `PUT` updates, or `DELETE` removals). `201 Created` specifically indicates that the request succeeded and resulted in the creation of a new resource on the server, conventionally returned on successful `POST` operations.

---

### 🟡 Mid-Level

#### Q3: What is MongoDB error code `11000`, and how should an API controller handle it?
> **Answer**: Error code `11000` is MongoDB's **Duplicate Key Error**. It occurs when an insert or update violates a unique index constraint (such as a unique `slug` or `email`). Controllers should catch this error specifically and return an HTTP `400 Bad Request` or `409 Conflict` with a user-friendly message (e.g. `"A project with this title already exists"`), rather than exposing raw database exceptions with a generic `500 Internal Server Error`.

#### Q4: Why is `runValidators: true` necessary in `findByIdAndUpdate`?
> **Answer**: In Mongoose, schema validation rules (like `required`, `min`, `maxlength`, `enum`) automatically run when calling `new Model()` or `model.save()`. However, `findByIdAndUpdate` executes directly against the MongoDB driver as an `updateOne` command for performance, bypassing Mongoose validation by default. Explicitly setting `{ runValidators: true }` instructs Mongoose to enforce the schema constraints on the update payload.

---

### 🔴 Senior Level

#### Q5: What is the N+1 Query Problem in document databases, and how does proper schema design prevent it?
> **Answer**: The N+1 problem occurs when fetching a list of $N$ parent records requires $N$ subsequent database queries to fetch associated child records. In relational databases or normalized NoSQL designs, fetching 10 projects and then fetching images or tech tags in a loop causes 11 queries. In our `Project` schema, embedding `images` and `techStack` directly within the Project document allows all related data to be fetched in a single $O(1)$ query, eliminating N+1 roundtrips.

