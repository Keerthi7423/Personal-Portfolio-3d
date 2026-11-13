# 📘 Day 5: Skill Model, Category Enums, & Full CRUD API

---

## 📑 Table of Contents
1. [Overview & Day 5 Goals](#1-overview--day-5-goals)
2. [Data Contract: The Skill Model](#2-data-contract-the-skill-model)
3. [Deep Dive: Mongoose Enums & Number Range Constraints](#3-deep-dive-mongoose-enums--number-range-constraints)
4. [Step-by-Step Implementation Guide](#4-step-by-step-implementation-guide)
   - Step 1: Create `server/models/Skill.js`
   - Step 2: Create `server/controllers/skillController.js`
   - Step 3: Create `server/routes/skillRoutes.js`
   - Step 4: Mount `skillRoutes` in `server/server.js`
5. [Connecting to Frontend Vision ("The Armory")](#5-connecting-to-frontend-vision-the-armory)
6. [Line-by-Line Code Breakdown](#6-line-by-line-code-breakdown)
7. [Postman Testing Matrix](#7-postman-testing-matrix)
8. [How Companies & Enterprises Maintain Master Data / Skills](#8-how-companies--enterprises-maintain-master-data--skills)
9. [Top Interview Questions & Deep Answers](#9-top-interview-questions--deep-answers)

---

## 1. Overview & Day 5 Goals

According to your 2-month plan for **Friday (Week 1, Day 5)**:
> *"Build the Skill model, controller, and routes."*

### Key Milestones Today:
- Design the **`Skill` Schema** with Mongoose **Enums** and numeric boundaries (`0` to `100`).
- Apply the **`asyncHandler`** and **`ErrorResponse`** architecture built on Day 4.
- Build 5 RESTful CRUD operations:
  1. `GET /api/skills`: Retrieve all skills (with optional filter by `?category=Frontend` and sorted by `order`).
  2. `GET /api/skills/:id`: Retrieve a specific skill by ID.
  3. `POST /api/skills`: Create a new skill (validates category enum and level range).
  4. `PUT /api/skills/:id`: Update skill fields with validator enforcement.
  5. `DELETE /api/skills/:id`: Delete a skill by ID.
- Mount the new router into `server/server.js` before the central error handler.

---

## 2. Data Contract: The Skill Model

According to Section 5 of your plan:
- **`name`** (`String`, required, unique, trimmed, e.g. `"React"`, `"Three.js"`, `"Node.js"`)
- **`category`** (`String`, required, enum: `['Frontend', 'Backend', 'Database', 'Tools']`)
- **`level`** (`Number`, min: 0, max: 100, default: 80 — represents proficiency percentage for UI progress bars)
- **`icon`** (`String`, default: '' — icon identifier, e.g. `"SiReact"`, `"FaNodeJs"`, or SVG/CDN URL)
- **`order`** (`Number`, default: 0 — custom drag-and-drop sort order)
- **`timestamps`** (`createdAt`, `updatedAt`)

---

## 3. Deep Dive: Mongoose Enums & Number Range Constraints

### Why Use `enum`?
An enum restricts a string field to a finite set of allowed values. If someone tries to create a skill with `category: "DevOps"` or `category: "frontend"` (lowercase), Mongoose rejects it before hitting the database:
```javascript
category: {
    type: String,
    required: [true, 'Please provide a skill category'],
    enum: {
        values: ['Frontend', 'Backend', 'Database', 'Tools'],
        message: '{VALUE} is not a valid category. Must be Frontend, Backend, Database, or Tools'
    }
}
```

### Why Use `min` and `max`?
For skill proficiency bars, values must stay between 0% and 100%. Mongoose enforces this natively:
```javascript
level: {
    type: Number,
    min: [0, 'Skill level cannot be less than 0'],
    max: [100, 'Skill level cannot exceed 100'],
    default: 80
}
```

---

## 4. Step-by-Step Implementation Guide

### Step 1: Create `server/models/Skill.js`
Inside `server/models/`, create a new file named `Skill.js`:

```javascript
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
```

---

### Step 2: Create `server/controllers/skillController.js`
Inside `server/controllers/`, create a file named `skillController.js`:

```javascript
const Skill = require('../models/Skill');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all skills (supports ?category=Frontend)
// @route   GET /api/skills
// @access  Public
const getSkills = asyncHandler(async (req, res, next) => {
    const query = {};
    if (req.query.category) {
        query.category = req.query.category;
    }

    // Sort by order ascending, then name alphabetically
    const skills = await Skill.find(query).sort({ order: 1, name: 1 });

    res.status(200).json({
        success: true,
        count: skills.length,
        data: skills
    });
});

// @desc    Get single skill by ID
// @route   GET /api/skills/:id
// @access  Public
const getSkillById = asyncHandler(async (req, res, next) => {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
        return next(
            new ErrorResponse(`Skill not found with id: ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: skill
    });
});

// @desc    Create a new skill
// @route   POST /api/skills
// @access  Admin (Private)
const createSkill = asyncHandler(async (req, res, next) => {
    const skill = await Skill.create(req.body);

    res.status(201).json({
        success: true,
        data: skill
    });
});

// @desc    Update a skill by ID
// @route   PUT /api/skills/:id
// @access  Admin (Private)
const updateSkill = asyncHandler(async (req, res, next) => {
    let skill = await Skill.findById(req.params.id);

    if (!skill) {
        return next(
            new ErrorResponse(`Skill not found with id: ${req.params.id}`, 404)
        );
    }

    skill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: skill
    });
});

// @desc    Delete a skill by ID
// @route   DELETE /api/skills/:id
// @access  Admin (Private)
const deleteSkill = asyncHandler(async (req, res, next) => {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
        return next(
            new ErrorResponse(`Skill not found with id: ${req.params.id}`, 404)
        );
    }

    await skill.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Skill deleted successfully',
        data: {}
    });
});

module.exports = {
    getSkills,
    getSkillById,
    createSkill,
    updateSkill,
    deleteSkill
};
```

---

### Step 3: Create `server/routes/skillRoutes.js`
Inside `server/routes/`, create a file named `skillRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const {
    getSkills,
    getSkillById,
    createSkill,
    updateSkill,
    deleteSkill
} = require('../controllers/skillController');

// /api/skills
router.route('/')
    .get(getSkills)
    .post(createSkill);

// /api/skills/:id
router.route('/:id')
    .get(getSkillById)
    .put(updateSkill)
    .delete(deleteSkill);

module.exports = router;
```

---

### Step 4: Mount `skillRoutes` in `server/server.js`

Open [`server/server.js`](file:///d:/Projects/Personal%20Portfolio/server/server.js):

1. Import `skillRoutes`:
   ```javascript
   const skillRoutes = require('./routes/skillRoutes');
   ```
2. Mount under `/api/skills` (before `app.use(errorHandler)`):
   ```javascript
   // Mount Routes
   app.use('/api/projects', projectRoutes);
   app.use('/api/skills', skillRoutes);

   // Central Error Handler (MUST BE AFTER ROUTES)
   app.use(errorHandler);
   ```

---

## 5. Connecting to Frontend Vision ("The Armory")

In Month 2 (Frontend), your portfolio section **"The Armory"** displays skills as glowing relic cards grouped into tabs or categories:
- **Frontend**: React, Three.js, GSAP, Tailwind CSS
- **Backend**: Node.js, Express, REST APIs, WebSockets
- **Database**: MongoDB, Mongoose, Redis
- **Tools**: Git, Docker, Postman, Vite, Blender

Because we built `?category=` filter support, the frontend can either:
1. Call `GET /api/skills` once and group by category in React.
2. Or call `GET /api/skills?category=Frontend` when switching tabs.

---

## 6. Line-by-Line Code Breakdown

### A. Sorting: `.sort({ order: 1, name: 1 })`
- `order: 1`: Ascending order (lowest number first, e.g. `order: 0`, then `order: 1`).
- `name: 1`: Tie-breaker. If two skills have the same order (e.g. both `0`), they are sorted alphabetically A $\rightarrow$ Z.

### B. Mongoose `{ runValidators: true }` in `updateSkill`
- When you update a skill with `PUT /api/skills/:id`, passing `{ level: 150 }` or `{ category: "InvalidCat" }` will be caught and rejected by Mongoose because `runValidators: true` is enabled. Without this, Mongoose would bypass enum validation during updates!

---

## 7. Postman Testing Matrix

### Test 1: Create a Valid Skill (`POST /api/skills`)
- **URL**: `http://localhost:5000/api/skills`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "React",
    "category": "Frontend",
    "level": 90,
    "icon": "react",
    "order": 1
  }
  ```
- **Expected Status**: `201 Created`

### Test 2: Invalid Enum Category Test (`POST /api/skills`)
- **Body**:
  ```json
  {
    "name": "Kubernetes",
    "category": "CloudInfra"
  }
  ```
- **Expected Status**: `400 Bad Request`
- **Expected Response**: Handled cleanly by Day 4's central error handler:
  ```json
  {
    "success": false,
    "error": ["CloudInfra is not a valid category. Allowed: Frontend, Backend, Database, Tools"]
  }
  ```

### Test 3: Number Out of Range Test (`POST /api/skills` with `level: 150`)
- **Body**:
  ```json
  {
    "name": "Node.js",
    "category": "Backend",
    "level": 150
  }
  ```
- **Expected Status**: `400 Bad Request` (`"Level cannot exceed 100"`)

### Test 4: Filter by Category (`GET /api/skills?category=Frontend`)
- **Method**: `GET`
- **Expected Status**: `200 OK` (Only returns skills where `category === "Frontend"`)

---

## 8. How Companies & Enterprises Maintain Master Data / Skills

1. **Taxonomy & Schema Versioning**: In enterprise HR, talent platforms (like LinkedIn), and developer portals, skills are treated as "Master Data" with unique UUIDs and canonical aliases (e.g. "React.js", "ReactJS" $\rightarrow$ "React").
2. **MongoDB `$group` Aggregation**: Rather than making 4 separate HTTP requests for 4 categories, an enterprise API often provides an endpoint `/api/skills/grouped` using MongoDB Aggregation Pipeline:
   ```javascript
   const groupedSkills = await Skill.aggregate([
       { $sort: { order: 1 } },
       {
           $group: {
               _id: '$category',
               skills: { $push: '$$ROOT' }
           }
       }
   ]);
   ```
   This groups all skills into categories directly inside the database engine in a single query.

---

## 9. Top Interview Questions & Deep Answers

### 🟢 Junior Level

#### Q1: What is an `enum` in Mongoose, and what happens when an invalid value is supplied?
> **Answer**: An `enum` is a built-in Mongoose validator that restricts string field values to a predefined list. If an insert or update query supplies a value not present in the enum array, Mongoose aborts the operation and throws a `ValidationError` before querying MongoDB.

#### Q2: What is the difference between sorting with `1` and `-1` in Mongoose?
> **Answer**: In Mongoose/MongoDB `.sort()`, `1` specifies **ascending** order (smallest to largest, A to Z, oldest to newest), while `-1` specifies **descending** order (largest to smallest, Z to A, newest to oldest).

---

### 🟡 Mid-Level

#### Q3: Why does `findByIdAndUpdate` need `{ runValidators: true }` to enforce `enum` and `min/max` rules?
> **Answer**: By default, Mongoose validation only runs on document save operations (`.save()`). Update queries (`findByIdAndUpdate`, `updateOne`) translate directly to native MongoDB commands for high performance, bypassing Mongoose validation hooks by default. Adding `{ runValidators: true }` forces Mongoose to run schema validation constraints against the update payload before executing the database update.

#### Q4: How does MongoDB handle unique index conflicts across different cases (e.g., "react" vs "React")?
> **Answer**: Standard MongoDB unique indexes are case-sensitive by default (allowing both `"React"` and `"react"`). In production, to enforce true case-insensitive uniqueness, we either normalize the field using a `lowercase: true` schema option or define a MongoDB Collation index with `strength: 2` (ignoring case differences).

---

### 🔴 Senior Level

#### Q5: Compare grouping data in Node.js application memory vs. using MongoDB's `$group` Aggregation Pipeline.
> **Answer**:
> - **In-Memory Grouping (Node.js)**: The server fetches all records over the network into Node's V8 heap and groups them with JavaScript `.reduce()`. While acceptable for small collections (like 20 skills), for large datasets it introduces network bandwidth saturation, high serialization latency, and memory bloat.
> - **MongoDB `$group` Aggregation**: The database engine processes the grouping internally using optimized C++ routines, utilizing indexes and returning only the finalized structured output across the wire. This drastically reduces network payload size and CPU usage on the API servers.

