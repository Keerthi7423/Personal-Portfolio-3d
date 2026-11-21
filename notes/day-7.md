# 📘 Day 7: Profile API (Singleton Pattern) & Week 1 Mastery Review

---

## 📑 Table of Contents
1. [Overview & Day 7 Goals](#1-overview--day-7-goals)
2. [The Singleton Pattern in REST & MongoDB](#2-the-singleton-pattern-in-rest--mongodb)
3. [The Profile Data Contract](#3-the-profile-data-contract)
4. [Step-by-Step Implementation Guide](#4-step-by-step-implementation-guide)
   - Step 1: Create `server/models/Profile.js`
   - Step 2: Create `server/controllers/profileController.js`
   - Step 3: Create `server/routes/profileRoutes.js`
   - Step 4: Mount in `server/server.js`
5. [Line-by-Line Code Breakdown](#5-line-by-line-code-breakdown)
   - [What is `upsert: true`?](#what-is-upsert-true)
   - [Nested Schemas & Subdocument Arrays](#nested-schemas--subdocument-arrays)
6. [Testing in Postman](#6-testing-in-postman)
7. [Week 1 Complete Architecture & API Map](#7-week-1-complete-architecture--api-map)
8. [Side Task: Doom-Inspired AI Mask Concept Prompts](#8-side-task-doom-inspired-ai-mask-concept-prompts)
9. [Top Interview Questions & Deep Answers](#9-top-interview-questions--deep-answers)

---

## 1. Overview & Day 7 Goals

According to your 2-month plan for **Sunday (Week 1, Day 7)**:
> *"Sun (5-6h): Build the Profile model and routes. Review the whole week, refactor, write notes of what you learned. Side task: generate 10+ mask concepts with AI."*

### Key Milestones Today:
- Design the **`Profile` Model** powering **"The Ruler" (About & Hero sections)**.
- Implement the **Singleton Pattern** using MongoDB's atomic `upsert: true`.
- Build endpoints:
  - `GET /api/profile`: Public endpoint returning your bio, contact info, stats, and social links.
  - `PUT /api/profile`: Admin endpoint updating (or initializing) the profile without needing an ID in the URL.
- Mount the route into `server/server.js`.
- Conduct a complete Week 1 review across all 6 core resources.

---

## 2. The Singleton Pattern in REST & MongoDB

In typical CRUD resources (like Projects, Skills, Messages), you have many documents:
- `GET /api/projects/:id`
- `DELETE /api/skills/:id`

However, **there is only one Keerthi Kumar V** in this portfolio. You will never have multiple profiles with different IDs.

### RESTful URL Design for Singletons:
- ❌ Bad: `PUT /api/profile/673892a0912fbc12` (Client should not need to memorize or query an arbitrary MongoDB ID just to update their own bio).
- ✅ Best Practice: `GET /api/profile` and `PUT /api/profile`.

By using `findOneAndUpdate({}, req.body, { new: true, upsert: true })`:
1. If no profile exists yet, MongoDB automatically **creates** it (`insert`).
2. If the profile already exists, MongoDB **updates** it (`update`).

---

## 3. The Profile Data Contract

According to Sections 5 & 8.A of your plan:
- **`name`** (`String`, required, default: `"Keerthi Kumar V"`)
- **`title`** (`String`, required, default: `"Full-Stack MERN Developer"`)
- **`tagline`** (`String`, default: `"I don't follow trends. I rule the stack."`)
- **`bio`** (`String`, required)
- **`photoUrl`** (`String`, default: `""`)
- **`resumeUrl`** (`String`, default: `""`)
- **`location`** (`String`, default: `""`)
- **`email`** (`String`, required)
- **`phone`** (`String`, default: `""`)
- **`socials`** (Object subdocument):
  - `github`: `String`
  - `linkedin`: `String`
  - `twitter`: `String`
  - `leetcode`: `String`
- **`yearsOfExperience`** (`Number`, default: `0`)
- **`stats`** (Array of subdocuments `[{ label: String, value: String }]`):
  - e.g. `[{ label: "Projects Completed", value: "12+" }, { label: "GitHub Contributions", value: "850+" }]`
- **`timestamps`** (`createdAt`, `updatedAt`)

---

## 4. Step-by-Step Implementation Guide

### Step 1: Create `server/models/Profile.js`

```javascript
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
```

---

### Step 2: Create `server/controllers/profileController.js`

```javascript
const Profile = require('../models/Profile');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get portfolio profile (About / Hero data)
// @route   GET /api/profile
// @access  Public
const getProfile = asyncHandler(async (req, res, next) => {
    let profile = await Profile.findOne();

    if (!profile) {
        // Return a default baseline profile if none has been saved yet
        profile = await Profile.create({
            name: 'Keerthi Kumar V',
            title: 'Full-Stack MERN Developer',
            tagline: "I don't follow trends. I rule the stack.",
            bio: 'Full-stack developer specializing in modern web applications, high-performance APIs, and interactive 3D experiences.',
            email: 'contact@keerthi.dev',
            stats: [
                { label: 'Projects Completed', value: '10+' },
                { label: 'Core Technologies', value: '15+' }
            ]
        });
    }

    res.status(200).json({
        success: true,
        data: profile
    });
});

// @desc    Update or initialize profile
// @route   PUT /api/profile
// @access  Admin (Private)
const updateProfile = asyncHandler(async (req, res, next) => {
    // Atomically find existing profile and update, or create if not found
    const profile = await Profile.findOneAndUpdate(
        {},
        req.body,
        {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true
        }
    );

    res.status(200).json({
        success: true,
        data: profile
    });
});

module.exports = {
    getProfile,
    updateProfile
};
```

---

### Step 3: Create `server/routes/profileRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile
} = require('../controllers/profileController');

// /api/profile
router.route('/')
    .get(getProfile)
    .put(updateProfile);

module.exports = router;
```

---

### Step 4: Mount in `server/server.js`

Open [`server/server.js`](file:///d:/Projects/Personal%20Portfolio/server/server.js):

1. Import `profileRoutes`:
   ```javascript
   const profileRoutes = require('./routes/profileRoutes');
   ```

2. Mount `/api/profile` with your other routes (before `errorHandler`):
   ```javascript
   // Mount Routes
   app.use('/api/profile', profileRoutes);
   app.use('/api/projects', projectRoutes);
   app.use('/api/skills', skillRoutes);
   app.use('/api/experience', experienceRoutes);
   app.use('/api/education', educationRoutes);
   app.use('/api/messages', messageRoutes);
   ```

---

## 5. Line-by-Line Code Breakdown

### What is `upsert: true`?
```javascript
Profile.findOneAndUpdate({}, req.body, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true
});
```
- **`{}`**: Empty query filter. Matches the first document found in the collection.
- **`upsert: true`** (`Update + Insert`): If a matching document is found, it updates it. If the collection is empty, it inserts `req.body` as a new document.
- **`new: true`**: Instructs Mongoose to return the freshly updated document rather than the old document before the update.
- **`runValidators: true`**: Enforces schema rules (e.g. required `email`, `bio`) on the incoming payload.
- **`setDefaultsOnInsert: true`**: Applies schema defaults (`yearsOfExperience: 1`, default taglines) if inserting for the first time.

### Nested Schemas & Subdocument Arrays
Notice `stats: [{ label, value }]`:
- In MongoDB, this is stored as an array of embedded documents.
- The public frontend can iterate over `profile.stats.map(s => <StatCounter label={s.label} value={s.value} />)` to dynamically render animated numbers on the About section without hardcoding!

---

## 6. Testing in Postman

### Test 1: Fetch Profile (`GET /api/profile`)
- **URL**: `http://localhost:5000/api/profile`
- **Method**: `GET`
- **Result**: `200 OK` returning your profile JSON.

### Test 2: Update Profile (`PUT /api/profile`)
- **URL**: `http://localhost:5000/api/profile`
- **Method**: `PUT`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "name": "Keerthi Kumar V",
    "title": "Full-Stack MERN Developer",
    "tagline": "I don't follow trends. I rule the stack.",
    "bio": "Passionate MERN developer crafting high-performance full-stack applications with 3D interactivity.",
    "email": "keerthi@example.com",
    "yearsOfExperience": 2,
    "socials": {
      "github": "https://github.com/Keerthi7423",
      "linkedin": "https://linkedin.com/in/keerthi",
      "twitter": "https://twitter.com/keerthi",
      "leetcode": "https://leetcode.com/keerthi"
    },
    "stats": [
      { "label": "Projects Completed", "value": "12+" },
      { "label": "GitHub Commits", "value": "500+" },
      { "label": "Years Experience", "value": "2" }
    ]
  }
  ```
- **Result**: `200 OK` with updated stats and socials!

---

## 7. Week 1 Complete Architecture & API Map

Congratulations! You have completed **Week 1: Backend Foundations** of your 2-month plan!

Here is your full REST API contract:

| Resource | HTTP Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| **Profile** | `GET` | `/api/profile` | Read About/Hero data | Public |
| **Profile** | `PUT` | `/api/profile` | Update bio, socials, stats | Admin |
| **Projects** | `GET` | `/api/projects` | Fetch all (`?featured=true`) | Public |
| **Projects** | `GET` | `/api/projects/:slug` | Fetch project by SEO slug | Public |
| **Projects** | `POST` | `/api/projects` | Create project (auto-slug) | Admin |
| **Projects** | `PUT` | `/api/projects/:id` | Update project by ID | Admin |
| **Projects** | `DELETE` | `/api/projects/:id` | Delete project by ID | Admin |
| **Skills** | `GET` | `/api/skills` | Fetch all (`?category=Frontend`) | Public |
| **Skills** | `POST` | `/api/skills` | Add skill (Enum checked) | Admin |
| **Skills** | `PUT` | `/api/skills/:id` | Update skill level/order | Admin |
| **Skills** | `DELETE` | `/api/skills/:id` | Remove skill | Admin |
| **Experience** | `GET` | `/api/experience` | Career timeline entries | Public |
| **Experience** | `POST/PUT/DEL`| `/api/experience/:id`| Manage career milestones | Admin |
| **Education** | `GET` | `/api/education` | Academic entries | Public |
| **Education** | `POST/PUT/DEL`| `/api/education/:id` | Manage degrees/grades | Admin |
| **Messages** | `POST` | `/api/messages` | Public Contact Form | Public |
| **Messages** | `GET` | `/api/messages` | Admin Inbox + Pagination | Admin |
| **Messages** | `PUT` | `/api/messages/:id/read`| Toggle Read/Unread | Admin |
| **Messages** | `DELETE` | `/api/messages/:id` | Delete message | Admin |

---

## 8. Side Task: Doom-Inspired AI Mask Concept Prompts

According to Section 10 of your plan:
> *"Generate 10+ original mask concepts with AI (15 minutes). Save favorites."*

> ⚠️ **Reminder**: To avoid Marvel copyright restrictions while capturing the dark steel royal aesthetic, generate an **original** hooded armored ruler faceplate with your personal monogram **"KKV"** engraved!

### Prompts to run in Midjourney, Ideogram, or Flux:

1. **Frontal Orthographic Concept**:
   > *"Original sci-fi armored ruler mask, hooded dark emerald cloak, riveted brushed-steel faceplate, narrow glowing radioactive-green eye slits, engraved sharp metallic 'KKV' crest on forehead, symmetrical front view, studio rim lighting, 8k resolution, octane 3D render, dark cinematic background."*

2. **Angle / Three-Quarter View**:
   > *"Three-quarter view of an original hooded monarch cybernetic armor mask, ornate brushed gunmetal steel plates with gold filigree rivets, intense neon green visor glow, high contrast lighting, cinematic atmosphere, 3D character asset style."*

3. **Minimal Monogram Logo (Ideogram)**:
   > *"Minimal sharp metallic monogram KKV, sharp angular futuristic steel letters, subtle neon green glowing outline, matte black background, vector icon style."*

---

## 9. Top Interview Questions & Deep Answers

### 🟢 Junior Level

#### Q1: What does `upsert: true` mean in MongoDB?
> **Answer**: `upsert` is a portmanteau of "Update" and "Insert". When performing an update query with `{ upsert: true }`, MongoDB checks if a document matching the query criteria exists. If it exists, MongoDB updates it. If no document matches, MongoDB automatically creates a new document populated with the update fields.

#### Q2: What is the difference between an embedded document and a referenced document in Mongoose?
> **Answer**:
> - **Embedded Document (Subdocument)**: The child data is nested directly inside the parent document (e.g. `socials: { github, linkedin }`). It is stored and retrieved in a single read without joins.
> - **Referenced Document**: The parent document stores only an `ObjectId` referring to another collection (`user: { type: ObjectId, ref: 'User' }`), requiring a `$lookup` or `.populate()` query to retrieve related data.

---

### 🟡 Mid-Level

#### Q3: Why is a Singleton pattern appropriate for a personal portfolio profile API?
> **Answer**: A personal portfolio website represents a single entity/developer. Providing typical multi-tenant CRUD endpoints with arbitrary IDs (e.g. `PUT /api/profile/64fa7e...`) forces the client application to query and manage an ID that will never change. Designing `/api/profile` as a singleton endpoint simplifies API consumption, eliminates useless ID route parameters, and uses atomic `upsert` operations to guarantee exactly one source of truth.

#### Q4: Why should `{ setDefaultsOnInsert: true }` be used with `findOneAndUpdate`?
> **Answer**: In Mongoose, schema default values (such as `default: 'Full-Stack Developer'`) automatically populate when creating a new instance via `new Model()` or `Model.create()`. However, `findOneAndUpdate` bypasses standard initialization. Setting `{ setDefaultsOnInsert: true }` ensures that if an `upsert` results in an insertion, all schema default values are correctly populated.

---

### 🔴 Senior Level

#### Q5: If multiple concurrent requests execute `findOneAndUpdate({}, req.body, { upsert: true })` on an empty collection, how do you prevent race condition duplicate inserts?
> **Answer**: In high-concurrency environments, two simultaneous `upsert` operations on an empty collection can both evaluate the filter `{}` as yielding zero results and attempt simultaneous inserts, resulting in duplicate documents. To guarantee absolute singleton uniqueness in MongoDB:
> 1. Add a constant unique key in the schema, e.g. `isSingleton: { type: Boolean, default: true, unique: true }`.
> 2. Query by that unique field: `Profile.findOneAndUpdate({ isSingleton: true }, req.body, { upsert: true })`.
> 3. If two concurrent requests hit at the exact same millisecond, MongoDB's unique index catches the second insert and rejects it with duplicate key error `11000`, preserving single-document integrity.
