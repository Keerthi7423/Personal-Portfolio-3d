# 📘 Day 9: Admin Authentication — Single-Admin Registration & Secure Login

---

## 📑 Table of Contents
1. [Overview & Day 9 Goals](#1-overview--day-9-goals)
2. [The Single-Admin Security Pattern](#2-the-single-admin-security-pattern)
3. [The `Admin` Model Architecture](#3-the-admin-model-architecture)
   - [Why `select: false` on Passwords?](#why-select-false-on-passwords)
   - [Mongoose Document Instance Methods](#mongoose-document-instance-methods)
4. [Token Cookie Delivery & `httpOnly` Security](#4-token-cookie-delivery--httponly-security)
5. [Step-by-Step Implementation Guide](#5-step-by-step-implementation-guide)
   - Step 1: Install `cookie-parser`
   - Step 2: Create `server/models/Admin.js`
   - Step 3: Create `server/controllers/authController.js`
   - Step 4: Create `server/routes/authRoutes.js`
   - Step 5: Mount in `server/server.js`
6. [Line-by-Line Code Breakdown](#6-line-by-line-code-breakdown)
7. [Postman Testing Matrix](#7-postman-testing-matrix)
8. [How Companies & Enterprises Maintain Authentication APIs](#8-how-companies--enterprises-maintain-authentication-apis)
9. [Top Interview Questions & Deep Answers](#9-top-interview-questions--deep-answers)

---

## 1. Overview & Day 9 Goals

According to your 2-month plan for **Tuesday (Week 2, Day 9)**:
> *"Tue (2h): Admin register (run once, then disable it) and login."*

### Key Milestones Today:
- Design the **`Admin` Model** with automated bcrypt password hashing on save.
- Implement **`select: false`** to protect password hashes from accidental API leaks.
- Build the **Single-Admin Registration** endpoint (`POST /api/auth/register`) that auto-disables once the owner account is created.
- Build the **Secure Login** endpoint (`POST /api/auth/login`) returning a signed JWT in an **`httpOnly` cookie**.
- Mount `cookie-parser` and `authRoutes` in `server.js`.

---

## 2. The Single-Admin Security Pattern

In multi-tenant SaaS applications (like Twitter or Shopify), public registration remains open permanently.

However, in a **Personal Portfolio**, there is only **one owner** (Keerthi). Leaving `/api/auth/register` open to the public is a critical security vulnerability that would allow unauthorized visitors to create admin accounts and alter your portfolio content.

### Our Solution: Auto-Disabling Registration
```javascript
const adminCount = await Admin.countDocuments();
if (adminCount > 0) {
    return next(new ErrorResponse('Registration is disabled. Admin account already exists.', 403));
}
```
- **First request**: Creates your account.
- **Every subsequent request**: Automatically blocked with `403 Forbidden`!

---

## 3. The `Admin` Model Architecture

### Why `select: false` on Passwords?
```javascript
password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
}
```
By default, queries like `Admin.find()` or `Admin.findById()` exclude the `password` field completely. Even if a bug in your code dumps the user object to the client, the bcrypt hash is never leaked!
When login verification is required, we explicitly opt-in: `Admin.findOne({ email }).select('+password')`.

### Mongoose Document Instance Methods
Instead of cluttering controllers with hashing and token signing code, we attach domain logic directly to the schema:
1. `admin.matchPassword(enteredPassword)`: Compares candidate passwords using `bcrypt.compare()`.
2. `admin.getSignedJwtToken()`: Signs a token containing the admin's MongoDB `_id`.

---

## 4. Token Cookie Delivery & `httpOnly` Security

When logging in, sending the JWT only in the JSON body forces frontends to store it in `localStorage`—which is vulnerable to XSS theft.

Instead, we send the token in an **`httpOnly` cookie**:

```javascript
const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true, // Prevents JavaScript document.cookie access (Blocks XSS)
    secure: process.env.NODE_ENV === 'production', // Only sent over HTTPS in production
    sameSite: 'strict' // Prevents CSRF attacks
};

res.cookie('token', token, options);
```

---

## 5. Step-by-Step Implementation Guide

### Step 1: Install `cookie-parser`
In your `server/` terminal:
```powershell
npm install cookie-parser
```

---

### Step 2: Create `server/models/Admin.js`
Inside `server/models/`, create `Admin.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AdminSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Please provide an email address'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address'
            ]
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false
        }
    },
    {
        timestamps: true
    }
);

// Pre-save hook: Hash password before saving to database
AdminSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Instance Method: Sign JWT Token
AdminSchema.methods.getSignedJwtToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

// Instance Method: Match entered password with hashed password
AdminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', AdminSchema);
```

---

### Step 3: Create `server/controllers/authController.js`
Inside `server/controllers/`, create `authController.js`:

```javascript
const Admin = require('../models/Admin');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Helper: Generate token, create httpOnly cookie, and send response
const sendTokenResponse = (admin, statusCode, res) => {
    const token = admin.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            admin: {
                id: admin._id,
                email: admin.email
            }
        });
};

// @desc    Register Admin (One-time only, then auto-disables)
// @route   POST /api/auth/register
// @access  Public (Locks after 1st user)
const register = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse('Please provide both email and password', 400));
    }

    // Security Check: Lock registration if an admin already exists
    const adminExists = await Admin.countDocuments();
    if (adminExists > 0) {
        return next(
            new ErrorResponse(
                'Registration is disabled. Admin account already exists.',
                403
            )
        );
    }

    const admin = await Admin.create({
        email,
        password
    });

    sendTokenResponse(admin, 201, res);
});

// @desc    Login Admin
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate email & password presence
    if (!email || !password) {
        return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for admin (explicitly select +password)
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    sendTokenResponse(admin, 200, res);
});

module.exports = {
    register,
    login
};
```

---

### Step 4: Create `server/routes/authRoutes.js`
Inside `server/routes/`, create `authRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

module.exports = router;
```

---

### Step 5: Mount in `server/server.js`

Open [`server/server.js`](file:///d:/Projects/Personal%20Portfolio/server/server.js):

1. Import `cookie-parser` and `authRoutes`:
   ```javascript
   const cookieParser = require('cookie-parser');
   const authRoutes = require('./routes/authRoutes');
   ```

2. Add `app.use(cookieParser());` right below `app.use(express.json());`:
   ```javascript
   // Middleware
   app.use(cors());
   app.use(express.json());
   app.use(cookieParser());
   ```

3. Mount `/api/auth`:
   ```javascript
   // Mount Routes
   app.use('/api/auth', authRoutes);
   app.use('/api/profile', profileRoutes);
   // ... rest of routes
   ```

---

## 6. Line-by-Line Code Breakdown

### Why `select('+password')`?
```javascript
const admin = await Admin.findOne({ email }).select('+password');
```
Because `password: { select: false }` was configured in the schema, standard queries never return `admin.password`. When authenticating, we must explicitly request the field with `+password` so `bcrypt.compare` has the hash to compare against.

### Generic "Invalid credentials" Message
Notice we return `"Invalid credentials"` for BOTH:
1. When the email doesn't exist in the database.
2. When the email exists but the password is wrong.

> 💡 **Security Best Practice**: Never reveal *"User not found"* or *"Wrong password"*. Doing so allows attackers to enumerate valid email addresses!

---

## 7. Postman Testing Matrix

### Test 1: First-Time Registration (`POST /api/auth/register`)
- **URL**: `http://localhost:5000/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "keerthi@admin.dev",
    "password": "SuperSecretPassword2026!"
  }
  ```
- **Expectation**: `201 Created` with JWT token and cookie set!

### Test 2: Verify Registration Lockout
- Send the exact same `POST /api/auth/register` request a second time.
- **Expectation**: `403 Forbidden`
  ```json
  {
    "success": false,
    "error": "Registration is disabled. Admin account already exists."
  }
  ```
  *(Registration is permanently locked!)*

### Test 3: Wrong Password Login (`POST /api/auth/login`)
- **Body**:
  ```json
  {
    "email": "keerthi@admin.dev",
    "password": "WrongPassword"
  }
  ```
- **Expectation**: `401 Unauthorized` with `"Invalid credentials"`.

### Test 4: Successful Login (`POST /api/auth/login`)
- **Body**:
  ```json
  {
    "email": "keerthi@admin.dev",
    "password": "SuperSecretPassword2026!"
  }
  ```
- **Expectation**: `200 OK` with token and `Set-Cookie` header!

---

## 8. How Companies & Enterprises Maintain Authentication APIs

1. **Brute Force Protection (Account Lockout / Rate Limiting)**:
   Enterprises attach strict rate limiters (e.g. 5 failed login attempts per 15 minutes per IP). After 5 consecutive failures, the account is temporarily locked to defeat dictionary attacks.
2. **Audit Logging**:
   Every successful and failed login logs the IP address, User-Agent, and timestamp to an audit log table for security forensics.
3. **Password Complexity Policies**:
   Zod or regex checks enforce minimum 8–12 characters, uppercase, lowercase, numbers, and symbols.

---

## 9. Top Interview Questions & Deep Answers

### 🟢 Junior Level

#### Q1: Why do we set `select: false` on the password field in Mongoose?
> **Answer**: `select: false` prevents the password hash from being retrieved during normal database queries by default. This eliminates the risk of accidentally exposing password hashes in API responses (such as `GET /api/users`), adding defense-in-depth against data leakage.

#### Q2: What is the purpose of `cookie-parser` middleware in Express?
> **Answer**: By default, Node.js receives cookies as an unparsed semicolon-separated string in the HTTP `Cookie` header. `cookie-parser` parses this raw string into a convenient JavaScript object attached to `req.cookies`, allowing route handlers and auth middleware to easily read token cookies.

---

### 🟡 Mid-Level

#### Q3: What is the difference between `adminSchema.methods` and `adminSchema.statics` in Mongoose?
> **Answer**:
> - **`methods`**: Instance methods called on a specific document instance (e.g. `const admin = await Admin.findById(...); admin.matchPassword(...)`). They have access to document fields via `this`.
> - **`statics`**: Static methods called directly on the Model itself (e.g. `Admin.findByCredentials(...)`). They operate at the collection level.

#### Q4: Why is returning "Invalid email" considered a security vulnerability compared to "Invalid credentials"?
> **Answer**: Revealing whether the email or password was the reason for login failure enables **User Enumeration Attacks**. An attacker can script requests against the login endpoint to discover which email addresses exist in the system, facilitating targeted phishing, credential stuffing, and social engineering attacks.

---

### 🔴 Senior Level

#### Q5: Explain the security implications of `sameSite: 'strict'` vs `sameSite: 'lax'` vs `sameSite: 'none'` for authentication cookies.
> **Answer**:
> - **`Strict`**: The cookie is never sent on cross-site requests (e.g. following an external link or third-party iframe). Offers the highest CSRF protection.
> - **`Lax`**: The default in modern browsers. The cookie is withheld on cross-site subrequests (like images or fetch calls), but sent when a user navigates via top-level link clicks (`<a>`).
> - **`None`**: The cookie is sent on all cross-site requests, but requires the `secure: true` (HTTPS) attribute. Necessary only when the frontend and backend are hosted on completely different domains (e.g. `vercel.app` frontend calling `render.com` backend), requiring robust CORS and anti-CSRF defenses.
