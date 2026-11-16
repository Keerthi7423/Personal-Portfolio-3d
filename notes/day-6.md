# 📘 Day 6: Experience, Education, & Contact Messages API

---

## 📑 Table of Contents
1. [Overview & Day 6 Goals](#1-overview--day-6-goals)
2. [Data Contracts](#2-data-contracts)
   - [A. Experience Model (`Chronicles: Career`)](#a-experience-model-chronicles-career)
   - [B. Education Model (`Chronicles: Academics`)](#b-education-model-chronicles-academics)
   - [C. Message Model (`Summon Me: Contact Form`)](#c-message-model-summon-me-contact-form)
3. [Step-by-Step Implementation Guide](#3-step-by-step-implementation-guide)
   - [Part 1: Experience (Model, Controller, Routes)](#part-1-experience-model-controller-routes)
   - [Part 2: Education (Model, Controller, Routes)](#part-2-education-model-controller-routes)
   - [Part 3: Messages (Model, Controller, Routes)](#part-3-messages-model-controller-routes)
   - [Part 4: Mount Everything in `server/server.js`](#part-4-mount-everything-in-serverserverjs)
4. [Line-by-Line Technical Breakdown](#4-line-by-line-technical-breakdown)
   - [Regex Email Validation](#regex-email-validation)
   - [Pagination & Search Queries](#pagination--search-queries)
   - [Date & Timeline Handling](#date--timeline-handling)
5. [Testing Matrix (Postman)](#5-testing-matrix-postman)
6. [How Companies & Enterprises Maintain Messaging & Audit Systems](#6-how-companies--enterprises-maintain-messaging--audit-systems)
7. [Top Interview Questions & Deep Answers](#7-top-interview-questions--deep-answers)

---

## 1. Overview & Day 6 Goals

According to your 2-month plan for **Saturday (Week 1, Day 6)**:
> *"Build Experience, Education, and Message models and routes. Organize code into models/controllers/routes folders."*

### Key Milestones Today:
1. **Experience API**: Powering the career timeline in the portfolio's **"Chronicles"** section.
2. **Education API**: Powering degrees, certifications, and academic milestones in **"Chronicles"**.
3. **Messages API**: Powering the **"Summon Me"** public contact form, enabling visitors/recruiters to send inquiries directly to your database, with an admin inbox to mark messages as read and delete them.
4. Integrate all 3 resources seamlessly into the existing MVC + `asyncHandler` + central error handler architecture.

---

## 2. Data Contracts

### A. Experience Model (`Chronicles: Career`)
- `company` (`String`, required, trimmed)
- `role` (`String`, required, trimmed)
- `startDate` (`String`, required, e.g. `"July 2024"`)
- `endDate` (`String`, default: `""` — e.g. `"Present"` or `"Dec 2025"`)
- `current` (`Boolean`, default: `false`)
- `description` (`[String]` — array of bullet points describing impact and responsibilities)
- `techUsed` (`[String]` — array of technologies used, e.g. `["React", "Node.js", "Docker"]`)
- `order` (`Number`, default: `0` — sort order)
- `timestamps` (`createdAt`, `updatedAt`)

### B. Education Model (`Chronicles: Academics`)
- `institution` (`String`, required, trimmed, e.g. university / college name)
- `degree` (`String`, required, trimmed, e.g. `"B.E. Computer Science"`)
- `startYear` (`String`, required, e.g. `"2021"`)
- `endYear` (`String`, default: `""`, e.g. `"2025"`)
- `grade` (`String`, default: `""`, e.g. `"8.5 CGPA"`)
- `order` (`Number`, default: `0`)
- `timestamps` (`createdAt`, `updatedAt`)

### C. Message Model (`Summon Me: Contact Form`)
- `name` (`String`, required, trimmed)
- `email` (`String`, required, regex validated for legitimate email syntax)
- `subject` (`String`, default: `"General Inquiry"`, trimmed)
- `message` (`String`, required, trimmed, maxlength: 2000)
- `read` (`Boolean`, default: `false` — unread badge in Admin Panel)
- `timestamps` (`createdAt`, `updatedAt`)

---

## 3. Step-by-Step Implementation Guide

### Part 1: Experience (Model, Controller, Routes)

#### 1.1 Model: `server/models/Experience.js`
```javascript
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
```

#### 1.2 Controller: `server/controllers/experienceController.js`
```javascript
const Experience = require('../models/Experience');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all experience entries
// @route   GET /api/experience
// @access  Public
const getExperience = asyncHandler(async (req, res, next) => {
    const experiences = await Experience.find().sort({ order: 1, createdAt: -1 });

    res.status(200).json({
        success: true,
        count: experiences.length,
        data: experiences
    });
});

// @desc    Get single experience by ID
// @route   GET /api/experience/:id
// @access  Public
const getExperienceById = asyncHandler(async (req, res, next) => {
    const experience = await Experience.findById(req.params.id);

    if (!experience) {
        return next(
            new ErrorResponse(`Experience not found with id: ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: experience
    });
});

// @desc    Create new experience entry
// @route   POST /api/experience
// @access  Admin (Private)
const createExperience = asyncHandler(async (req, res, next) => {
    const experience = await Experience.create(req.body);

    res.status(201).json({
        success: true,
        data: experience
    });
});

// @desc    Update experience entry
// @route   PUT /api/experience/:id
// @access  Admin (Private)
const updateExperience = asyncHandler(async (req, res, next) => {
    let experience = await Experience.findById(req.params.id);

    if (!experience) {
        return next(
            new ErrorResponse(`Experience not found with id: ${req.params.id}`, 404)
        );
    }

    experience = await Experience.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: experience
    });
});

// @desc    Delete experience entry
// @route   DELETE /api/experience/:id
// @access  Admin (Private)
const deleteExperience = asyncHandler(async (req, res, next) => {
    const experience = await Experience.findById(req.params.id);

    if (!experience) {
        return next(
            new ErrorResponse(`Experience not found with id: ${req.params.id}`, 404)
        );
    }

    await experience.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Experience entry deleted successfully',
        data: {}
    });
});

module.exports = {
    getExperience,
    getExperienceById,
    createExperience,
    updateExperience,
    deleteExperience
};
```

#### 1.3 Routes: `server/routes/experienceRoutes.js`
```javascript
const express = require('express');
const router = express.Router();
const {
    getExperience,
    getExperienceById,
    createExperience,
    updateExperience,
    deleteExperience
} = require('../controllers/experienceController');

// /api/experience
router.route('/')
    .get(getExperience)
    .post(createExperience);

// /api/experience/:id
router.route('/:id')
    .get(getExperienceById)
    .put(updateExperience)
    .delete(deleteExperience);

module.exports = router;
```

---

### Part 2: Education (Model, Controller, Routes)

#### 2.1 Model: `server/models/Education.js`
```javascript
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
```

#### 2.2 Controller: `server/controllers/educationController.js`
```javascript
const Education = require('../models/Education');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all education entries
// @route   GET /api/education
// @access  Public
const getEducation = asyncHandler(async (req, res, next) => {
    const educations = await Education.find().sort({ order: 1, createdAt: -1 });

    res.status(200).json({
        success: true,
        count: educations.length,
        data: educations
    });
});

// @desc    Get single education entry by ID
// @route   GET /api/education/:id
// @access  Public
const getEducationById = asyncHandler(async (req, res, next) => {
    const education = await Education.findById(req.params.id);

    if (!education) {
        return next(
            new ErrorResponse(`Education not found with id: ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: education
    });
});

// @desc    Create new education entry
// @route   POST /api/education
// @access  Admin (Private)
const createEducation = asyncHandler(async (req, res, next) => {
    const education = await Education.create(req.body);

    res.status(201).json({
        success: true,
        data: education
    });
});

// @desc    Update education entry
// @route   PUT /api/education/:id
// @access  Admin (Private)
const updateEducation = asyncHandler(async (req, res, next) => {
    let education = await Education.findById(req.params.id);

    if (!education) {
        return next(
            new ErrorResponse(`Education not found with id: ${req.params.id}`, 404)
        );
    }

    education = await Education.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: education
    });
});

// @desc    Delete education entry
// @route   DELETE /api/education/:id
// @access  Admin (Private)
const deleteEducation = asyncHandler(async (req, res, next) => {
    const education = await Education.findById(req.params.id);

    if (!education) {
        return next(
            new ErrorResponse(`Education not found with id: ${req.params.id}`, 404)
        );
    }

    await education.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Education entry deleted successfully',
        data: {}
    });
});

module.exports = {
    getEducation,
    getEducationById,
    createEducation,
    updateEducation,
    deleteEducation
};
```

#### 2.3 Routes: `server/routes/educationRoutes.js`
```javascript
const express = require('express');
const router = express.Router();
const {
    getEducation,
    getEducationById,
    createEducation,
    updateEducation,
    deleteEducation
} = require('../controllers/educationController');

// /api/education
router.route('/')
    .get(getEducation)
    .post(createEducation);

// /api/education/:id
router.route('/:id')
    .get(getEducationById)
    .put(updateEducation)
    .delete(deleteEducation);

module.exports = router;
```

---

### Part 3: Messages (Model, Controller, Routes)

#### 3.1 Model: `server/models/Message.js`
```javascript
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
```

#### 3.2 Controller: `server/controllers/messageController.js`
```javascript
const Message = require('../models/Message');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all messages (Admin inbox with pagination & unread count)
// @route   GET /api/messages
// @access  Admin (Private)
const getMessages = asyncHandler(async (req, res, next) => {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Optional filter by read status (?read=false)
    const query = {};
    if (req.query.read !== undefined) {
        query.read = req.query.read === 'true';
    }

    const total = await Message.countDocuments(query);
    const unreadCount = await Message.countDocuments({ read: false });

    const messages = await Message.find(query)
        .sort({ createdAt: -1 }) // Newest messages first
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

    // Toggle or set read status
    message.read = req.body.read !== undefined ? req.body.read : !message.read;
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
```

#### 3.3 Routes: `server/routes/messageRoutes.js`
```javascript
const express = require('express');
const router = express.Router();
const {
    getMessages,
    createMessage,
    toggleMessageRead,
    deleteMessage
} = require('../controllers/messageController');

// /api/messages
router.route('/')
    .get(getMessages)
    .post(createMessage);

// /api/messages/:id/read (Toggle read status)
router.route('/:id/read')
    .put(toggleMessageRead);

// /api/messages/:id (Delete message)
router.route('/:id')
    .delete(deleteMessage);

module.exports = router;
```

---

### Part 4: Mount Everything in `server/server.js`

Open [`server/server.js`](file:///d:/Projects/Personal%20Portfolio/server/server.js):

1. Import the three new routers:
   ```javascript
   const experienceRoutes = require('./routes/experienceRoutes');
   const educationRoutes = require('./routes/educationRoutes');
   const messageRoutes = require('./routes/messageRoutes');
   ```

2. Mount them after `/api/skills` and **BEFORE** `app.use(errorHandler);`:
   ```javascript
   // Mount Routes
   app.use('/api/projects', projectRoutes);
   app.use('/api/skills', skillRoutes);
   app.use('/api/experience', experienceRoutes);
   app.use('/api/education', educationRoutes);
   app.use('/api/messages', messageRoutes);

   // Central Error Handler (MUST BE LAST)
   app.use(errorHandler);
   ```

---

## 4. Line-by-Line Technical Breakdown

### Regex Email Validation in `Message.js`
```javascript
match: [
    /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
    'Please provide a valid email address'
]
```
- `^\w+([.-]?\w+)*`: Ensures the username portion starts with alphanumeric characters, allowing dots or hyphens.
- `@\w+`: Enforces an `@` symbol followed by the domain name.
- `(\.\w{2,3})+$`: Enforces valid Top-Level Domain (TLD) syntax like `.com`, `.org`, or `.in`.
- If invalid (e.g. `user@gmail`), Mongoose throws a `ValidationError` which our Day 4 `errorHandler` catches as `400 Bad Request`.

### Pagination in `messageController.js`
```javascript
const page = parseInt(req.query.page, 10) || 1;
const limit = parseInt(req.query.limit, 10) || 10;
const startIndex = (page - 1) * limit;

const messages = await Message.find()
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);
```
- For Page 1 (`limit: 10`): `startIndex = (1-1)*10 = 0` $\rightarrow$ skips 0, returns first 10.
- For Page 2 (`limit: 10`): `startIndex = (2-1)*10 = 10` $\rightarrow$ skips first 10, returns next 10.
- Keeps database response fast even if recruiters send hundreds of messages over time.

---

## 5. Testing Matrix (Postman)

### Test 1: Submit Contact Form (`POST /api/messages`)
- **URL**: `http://localhost:5000/api/messages`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "Sarah Connor",
    "email": "sarah@techcorp.com",
    "subject": "Full-Stack Developer Opportunity",
    "message": "Hi Keerthi, loved your 3D portfolio! We have an opening for a Full-Stack MERN developer."
  }
  ```
- **Expectation**: `201 Created` with `"read": false`.

### Test 2: Invalid Email Test (`POST /api/messages` with bad email)
- **Body**: `{ "name": "Bot", "email": "notanemail", "message": "Hi" }`
- **Expectation**: `400 Bad Request` with `"Please provide a valid email address"`.

### Test 3: Mark Message as Read (`PUT /api/messages/<id>/read`)
- **Method**: `PUT`
- **Expectation**: `200 OK` with `"read": true`.

### Test 4: Create Experience (`POST /api/experience`)
- **Body**:
  ```json
  {
    "company": "Tech Solutions Inc.",
    "role": "Full-Stack Developer Intern",
    "startDate": "Jan 2024",
    "endDate": "Present",
    "current": true,
    "description": [
      "Built responsive 3D React web apps using Three.js and Tailwind.",
      "Engineered secure REST APIs with Node.js and MongoDB."
    ],
    "techUsed": ["React", "Node.js", "Express", "MongoDB", "Three.js"]
  }
  ```
- **Expectation**: `201 Created`.

---

## 6. How Companies & Enterprises Maintain Messaging & Audit Systems

1. **Email Dispatch Integration (Nodemailer / Resend / AWS SES)**:
   In Week 2, when `createMessage` is called, the server will not only save to MongoDB, but also trigger an asynchronous email alert directly to your personal inbox notifying you of the new message.
2. **Rate Limiting**: Public contact forms are prime targets for automated spam bots. In Week 2, we will attach `express-rate-limit` to `/api/messages` to allow a maximum of 5 messages per hour per IP.
3. **Database Capping / Retention**: For high-volume messages, enterprises use MongoDB TTL (Time-To-Live) indexes to automatically expire junk contact requests after 90 days.

---

## 7. Top Interview Questions & Deep Answers

### 🟢 Junior Level

#### Q1: What is the purpose of `skip()` and `limit()` in MongoDB?
> **Answer**: `skip(n)` instructs MongoDB to bypass the first $n$ documents in the query result set, while `limit(m)` restricts the number of returned documents to at most $m$. Together, they form the foundation of offset-based pagination (`skip = (page - 1) * limit`).

#### Q2: Why is storing an array of strings like `description: [String]` useful in MongoDB compared to a relational database?
> **Answer**: In relational databases, storing multiple bullet points requires either creating a separate child table (`experience_bullet_points`) with a foreign key join or storing a delimited string. In MongoDB, documents natively support nested arrays of primitives, allowing bullet points to be retrieved and stored in a single query without joins.

---

### 🟡 Mid-Level

#### Q3: What is the risk of offset-based pagination (`skip/limit`) on very large collections, and how do enterprises solve it?
> **Answer**: In offset-based pagination, executing `.skip(100000)` requires MongoDB to scan through and discard the first 100,000 documents in memory before returning the next 10, resulting in high latency ($O(N)$ performance). For large collections, enterprises use **Cursor-based pagination (Keyset pagination)**, where queries search on an indexed field like `_id` (`{ _id: { $lt: lastSeenId } }`), providing consistent $O(1)$ lookup performance.

#### Q4: Why do we use regex validation at the Mongoose level instead of relying only on frontend validation?
> **Answer**: Frontend validation only protects the user experience and can be completely bypassed using curl, Postman, or automated scripts. Backend validation is the ultimate security boundary ensuring database integrity, preventing garbage data injection, and shielding downstream notification services from processing invalid emails.

---

### 🔴 Senior Level

#### Q5: How would you prevent a Contact Form endpoint from being abused for DDoS or mail-relay spam?
> **Answer**:
> 1. **IP Rate Limiting**: Restrict requests per IP (e.g. 5 requests / 15 minutes) using Redis-backed rate limiting (`express-rate-limit`).
> 2. **Honeypot Fields**: Add a hidden form field in the UI invisible to humans; if populated, it is a bot and is rejected silently.
> 3. **CAPTCHA / Proof-of-Work**: Use Cloudflare Turnstile or reCAPTCHA v3 score-based checks.
> 4. **Asynchronous Background Processing**: Instead of sending emails synchronously during the HTTP request, push the message task onto a Redis message queue (BullMQ / RabbitMQ) to decouple email latency from the user response.
