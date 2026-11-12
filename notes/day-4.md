# 📘 Day 4: Centralized Error Handling & Async Wrapper Middleware

---

## 📑 Table of Contents
1. [Overview & Day 4 Goals](#1-overview--day-4-goals)
2. [The Problem with Repeated `try/catch` (DRY Violation)](#2-the-problem-with-repeated-trycatch-dry-violation)
3. [Deep Dive: The Async Wrapper (`asyncHandler`)](#3-deep-dive-the-async-wrapper-asynchandler)
4. [Custom Error Class (`ErrorResponse`)](#4-custom-error-class-errorresponse)
5. [The Central Error Handling Middleware (`middleware/error.js`)](#5-the-central-error-handling-middleware-middlewareerrorjs)
6. [Step-by-Step Implementation Guide](#6-step-by-step-implementation-guide)
   - Step 1: Create `server/utils/errorResponse.js`
   - Step 2: Create `server/middleware/asyncHandler.js`
   - Step 3: Create `server/middleware/error.js`
   - Step 4: Refactor `server/controllers/projectController.js`
   - Step 5: Mount Error Middleware in `server/server.js`
7. [Comprehensive Postman Testing Guide (Success & Edge Cases)](#7-comprehensive-postman-testing-guide-success--edge-cases)
8. [How Companies & Enterprises Maintain Error Handling](#8-how-companies--enterprises-maintain-error-handling)
9. [Top Interview Questions & Deep Answers](#9-top-interview-questions--deep-answers)

---

## 1. Overview & Day 4 Goals

According to your 2-month plan for **Thursday (Week 1, Day 4)**:
> *"Test every route in Postman. Write the central error-handling middleware and an async wrapper."*

### Key Milestones Today:
- Eliminate `try/catch` boilerplate across all controllers using a higher-order **`asyncHandler`**.
- Implement a subclassed **`ErrorResponse`** class inheriting from JavaScript’s built-in `Error`.
- Build an enterprise-grade **Central Error Handler** catching:
  1. Mongoose invalid `ObjectId` (`CastError`).
  2. Mongoose unique constraint violations (`code: 11000`).
  3. Mongoose schema validation failures (`ValidationError`).
- Test all positive paths and edge/error cases in Postman.

---

## 2. The Problem with Repeated `try/catch` (DRY Violation)

In Day 3, every controller had this structure:
```javascript
const getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
```

### Why this is problematic in production:
1. **Code Duplication**: If you have 50 controller methods, you write `try/catch` 50 times.
2. **Inconsistent Error Formats**: One controller might return `{ error: err.message }` while another returns `{ message: err.message }`.
3. **Leaked Server Details**: Raw unformatted errors can leak database internals and server paths to malicious clients.
4. **Unhandled Promise Rejections**: If an async error is not caught inside Express 4, the request hangs or crashes Node.

---

## 3. Deep Dive: The Async Wrapper (`asyncHandler`)

An **`asyncHandler`** is a **Higher-Order Function** (a function that takes a function as an argument and returns a new function):

```javascript
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
```

### How it works under the hood:
1. When Express runs a route, it calls the wrapper function `(req, res, next)`.
2. The wrapper executes your controller `fn(req, res, next)`.
3. Because `fn` is an `async` function, it returns a JavaScript `Promise`.
4. If the promise resolves successfully, the response is sent normally.
5. If the promise **rejects** (an error is thrown), `.catch(next)` catches it and calls Express's built-in `next(error)`.
6. Express skips all normal routes and immediately transfers execution to the **Central Error Middleware**!

---

## 4. Custom Error Class (`ErrorResponse`)

JavaScript's native `Error` only accepts a `message`. To associate HTTP status codes (e.g. 404, 400, 401, 403), we extend the `Error` class:

```javascript
class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
```

Now, instead of manually crafting status responses, you simply throw an error anywhere in your business logic:
```javascript
if (!project) {
    throw new ErrorResponse(`Project not found with id of ${req.params.id}`, 404);
}
```

---

## 5. The Central Error Handling Middleware (`middleware/error.js`)

Express identifies an error-handling middleware **only** when a function declares **exactly 4 arguments**: `(err, req, res, next)`.

Our central error handler intercepts specific database errors and transforms them into clean HTTP responses:

| Error Type | Trigger | Default Mongoose Error | Our Clean API Response |
| :--- | :--- | :--- | :--- |
| **`CastError`** | Invalid MongoDB ID (e.g. `GET /api/projects/123xyz`) | `Cast to ObjectId failed for value "123xyz"` | `404 Not Found: "Resource not found with id of 123xyz"` |
| **`11000 (Duplicate)`**| Inserting duplicate unique field (e.g. same title/slug) | `E11000 duplicate key error collection` | `400 Bad Request: "Duplicate field value entered"` |
| **`ValidationError`** | Missing `required` fields or invalid data types | `Project validation failed: title: Please provide a title` | `400 Bad Request: ["Please provide a title", ...]` |

---

## 6. Step-by-Step Implementation Guide

### Step 1: Create `server/utils/errorResponse.js`
Create folder `server/utils/` and file `server/utils/errorResponse.js`:

```javascript
class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

module.exports = ErrorResponse;
```

---

### Step 2: Create `server/middleware/asyncHandler.js`
Create folder `server/middleware/` and file `server/middleware/asyncHandler.js`:

```javascript
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
```

---

### Step 3: Create `server/middleware/error.js`
Inside `server/middleware/`, create `error.js`:

```javascript
const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console for developer debugging
    console.error(`💥 Error: ${err.message}`.red || `💥 Error: ${err.message}`);

    // Mongoose Bad ObjectId (CastError)
    if (err.name === 'CastError') {
        const message = `Resource not found with id: ${err.value}`;
        error = new ErrorResponse(message, 404);
    }

    // Mongoose Duplicate Key (11000)
    if (err.code === 11000) {
        const message = 'Duplicate field value entered. A record with that identifier already exists.';
        error = new ErrorResponse(message, 400);
    }

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message);
        error = new ErrorResponse(message, 400);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal Server Error'
    });
};

module.exports = errorHandler;
```

---

### Step 4: Refactor `server/controllers/projectController.js`

With `asyncHandler` and `ErrorResponse`, we can remove all `try/catch` blocks! Look how clean, concise, and professional the controller becomes:

```javascript
const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const slugify = require('slugify');

// @desc    Get all projects (supports ?featured=true)
// @route   GET /api/projects
// @access  Public
const getProjects = asyncHandler(async (req, res, next) => {
    const query = {};
    if (req.query.featured === 'true') {
        query.featured = true;
    }

    const projects = await Project.find(query).sort({ order: 1, createdAt: -1 });

    res.status(200).json({
        success: true,
        count: projects.length,
        data: projects
    });
});

// @desc    Get single project by slug
// @route   GET /api/projects/:slug
// @access  Public
const getProjectBySlug = asyncHandler(async (req, res, next) => {
    const project = await Project.findOne({ slug: req.params.slug });

    if (!project) {
        return next(
            new ErrorResponse(`Project not found with slug: ${req.params.slug}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: project
    });
});

// @desc    Create a new project
// @route   POST /api/projects
// @access  Admin (Private)
const createProject = asyncHandler(async (req, res, next) => {
    const project = await Project.create(req.body);

    res.status(201).json({
        success: true,
        data: project
    });
});

// @desc    Update project by ID
// @route   PUT /api/projects/:id
// @access  Admin (Private)
const updateProject = asyncHandler(async (req, res, next) => {
    let project = await Project.findById(req.params.id);

    if (!project) {
        return next(
            new ErrorResponse(`Project not found with id: ${req.params.id}`, 404)
        );
    }

    // Regenerate slug if title updated
    if (req.body.title && req.body.title !== project.title) {
        req.body.slug = slugify(req.body.title, { lower: true, strict: true });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: project
    });
});

// @desc    Delete project by ID
// @route   DELETE /api/projects/:id
// @access  Admin (Private)
const deleteProject = asyncHandler(async (req, res, next) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        return next(
            new ErrorResponse(`Project not found with id: ${req.params.id}`, 404)
        );
    }

    await project.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
        data: {}
    });
});

module.exports = {
    getProjects,
    getProjectBySlug,
    createProject,
    updateProject,
    deleteProject
};
```

---

### Step 5: Mount Error Middleware in `server/server.js`

In [`server/server.js`](file:///d:/Projects/Personal%20Portfolio/server/server.js):
1. Import `errorHandler`:
   ```javascript
   const errorHandler = require('./middleware/error');
   ```
2. Mount `errorHandler` **AFTER all routes** (must be the very last middleware before `app.listen`):
   ```javascript
   // Mount Routes
   app.use('/api/projects', projectRoutes);

   // Central Error Handler (MUST BE LAST)
   app.use(errorHandler);
   ```

> ⚠️ **Critical Rule**: If you put `app.use(errorHandler)` above `app.use('/api/projects', ...)`, it will never catch route errors! In Express, middleware order dictates the execution pipeline.

---

## 7. Comprehensive Postman Testing Guide (Success & Edge Cases)

### Test 1: Successful Create (`POST /api/projects`)
- **URL**: `http://localhost:5000/api/projects`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "title": "Doom 3D Portfolio",
    "shortDescription": "Dark cinematic full-stack portfolio with 3D mask hero.",
    "techStack": ["React", "Three.js", "Node.js", "Express", "MongoDB"],
    "featured": true,
    "order": 1
  }
  ```
- **Expectation**: `201 Created` with `"slug": "doom-3d-portfolio"`.

### Test 2: Validation Error (`POST /api/projects` with missing required fields)
- **Body**:
  ```json
  {
    "techStack": ["React"]
  }
  ```
- **Expectation**: `400 Bad Request`
  ```json
  {
    "success": false,
    "error": ["Please provide a project title", "Please provide a short description"]
  }
  ```

### Test 3: Duplicate Title/Slug (`POST /api/projects` with same title again)
- **Expectation**: `400 Bad Request`
  ```json
  {
    "success": false,
    "error": "Duplicate field value entered. A record with that identifier already exists."
  }
  ```

### Test 4: Bad ObjectId format (`PUT /api/projects/123badid`)
- **Expectation**: `404 Not Found`
  ```json
  {
    "success": false,
    "error": "Resource not found with id: 123badid"
  }
  ```

### Test 5: Valid ID format but not in Database (`DELETE /api/projects/507f1f77bcf86cd799439011`)
- **Expectation**: `404 Not Found`
  ```json
  {
    "success": false,
    "error": "Project not found with id: 507f1f77bcf86cd799439011"
  }
  ```

---

## 8. How Companies & Enterprises Maintain Error Handling

1. **Error Tracking & APM (Application Performance Monitoring)**:
   In production, central error handlers integrate with **Sentry**, **Datadog**, or **New Relic**. When an unhandled 500 error occurs, Sentry captures the full stack trace, user session, and request headers, sending an alert to Slack/PagerDuty.
2. **Environment Masking**:
   Stack traces contain file paths and code snippets. Production environments mask `err.stack` and only expose it when `process.env.NODE_ENV === 'development'`.
3. **Operational vs Programmer Errors**:
   - *Operational errors*: Expected runtime errors (e.g., user entered invalid password, file not found) $\rightarrow$ return clean 4xx code.
   - *Programmer errors*: Bugs, typos, null pointers $\rightarrow$ log as critical, return generic 500, trigger alarms.

---

## 9. Top Interview Questions & Deep Answers

### 🟢 Junior Level

#### Q1: How does Express know that a middleware function is an error handler?
> **Answer**: Express determines middleware type by the number of declared function parameters using `fn.length`. Standard middleware has 2 or 3 parameters `(req, res, next)`. An error-handling middleware **must declare exactly 4 parameters**: `(err, req, res, next)`. Even if `next` is not used in the function body, it must be specified in the parameter list.

#### Q2: What happens if an error handler middleware is placed BEFORE route declarations?
> **Answer**: Express executes middleware sequentially in the order registered via `app.use()`. If the error handler is placed above the routes, incoming requests pass through it before hitting the route handlers. Because no error has occurred yet, it does not catch any route errors. Error-handling middleware must always be mounted **after** all route handlers.

---

### 🟡 Mid-Level

#### Q3: What is the purpose of an async wrapper (`asyncHandler`) in Express?
> **Answer**: Express 4 routing pipeline does not automatically catch rejected Promises from `async` route handlers. Without a wrapper, developers must manually wrap every async handler in a `try/catch` block and call `next(error)`. The `asyncHandler` higher-order function takes an async controller, runs it, and automatically attaches `.catch(next)`, passing any thrown exception directly to the central error middleware while eliminating repeated boilerplate.

#### Q4: How do you differentiate a Mongoose `CastError` from a generic database error?
> **Answer**: When Mongoose fails to cast a string into a valid BSON 12-byte `ObjectId` (for example, passing `/api/projects/abc123`), it throws an error whose `err.name === 'CastError'`. By checking `err.name === 'CastError'` in the central error middleware, we can map this internal database casting failure into a user-friendly `404 Not Found` response instead of an unexpected `500 Internal Server Error`.

---

### 🔴 Senior Level

#### Q5: How should a production Node.js application handle unhandled promise rejections and uncaught exceptions?
> **Answer**: In production, unhandled rejections and exceptions leave the Node process in an indeterminate, corrupted state. Best practices dictate registering top-level process listeners:
> ```javascript
> process.on('unhandledRejection', (err) => {
>     console.error(`Unhandled Rejection: ${err.message}`);
>     server.close(() => process.exit(1));
> });
> ```
> Rather than attempting to continue serving traffic with broken in-memory state, the server stops accepting new connections, drains existing connections, logs the incident to telemetry (Sentry/CloudWatch), and exits (`process.exit(1)`). A container supervisor (Kubernetes/Docker/PM2) automatically restarts a clean worker instance.

