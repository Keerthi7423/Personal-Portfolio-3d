# 📘 Day 11: Production Security — Helmet, CORS with Credentials, Rate Limiting & NoSQL Sanitization

---

## 📑 Table of Contents
1. [Overview & Day 11 Goals](#1-overview--day-11-goals)
2. [The Web Security Threat Landscape (OWASP Top 10)](#2-the-web-security-threat-landscape-owasp-top-10)
3. [Deep Dive: The 5 Security Pillars](#3-deep-dive-the-5-security-pillars)
   - [Pillar 1: HTTP Security Headers with Helmet](#pillar-1-http-security-headers-with-helmet)
   - [Pillar 2: CORS with Credentials (`httpOnly` Cookie Support)](#pillar-2-cors-with-credentials-httponly-cookie-support)
   - [Pillar 3: Rate Limiting (DDoS & Brute-Force Defense)](#pillar-3-rate-limiting-ddos--brute-force-defense)
   - [Pillar 4: NoSQL Injection Defense (`mongo-sanitize`)](#pillar-4-nosql-injection-defense-mongo-sanitize)
   - [Pillar 5: Input Validation & Sanitization](#pillar-5-input-validation--sanitization)
4. [Step-by-Step Implementation Guide](#4-step-by-step-implementation-guide)
   - Step 1: Install Security Packages
   - Step 2: Create `server/middleware/rateLimit.js`
   - Step 3: Update `server/.env` with `CLIENT_URL`
   - Step 4: Configure `server/server.js` with Full Security Suite
   - Step 5: Attach Specific Limiters to Auth and Message Routes
5. [Line-by-Line Code Breakdown](#5-line-by-line-code-breakdown)
6. [Postman Testing Matrix](#6-postman-testing-matrix)
7. [How Companies & Enterprises Maintain Production Security](#7-how-companies--enterprises-maintain-production-security)
8. [Top Interview Questions & Deep Answers](#8-top-interview-questions--deep-answers)

---

## 1. Overview & Day 11 Goals

According to your 2-month plan for **Thursday (Week 2, Day 11)**:
> *"Thu (2h): Add helmet, CORS with credentials, rate limiting, mongo-sanitize, and request validation."*

### Today's Mission:
Transform our functional REST API into a **hardened, production-grade enterprise backend**. We implement defense-in-depth against Clickjacking, Cross-Site Scripting (XSS), Cross-Site Request Forgery (CSRF), Distributed Denial of Service (DDoS), Brute-Force password attacks, and NoSQL Injection.

---

## 2. The Web Security Threat Landscape (OWASP Top 10)

| Vulnerability | Attack Method | Our Defense Today |
| :--- | :--- | :--- |
| **NoSQL Injection** | Attacker sends `{ "email": { "$gt": "" } }` to bypass login | `express-mongo-sanitize` strips all `$` and `.` characters |
| **Clickjacking** | Malicious site embeds your portfolio in an invisible `<iframe>` | `helmet` sets `X-Frame-Options: DENY` |
| **MIME Sniffing** | Browser executes malicious image upload as executable script | `helmet` sets `X-Content-Type-Options: nosniff` |
| **Credential Brute-Force**| Hacker tests 10,000 passwords/minute against `/api/auth/login` | `express-rate-limit` locks IP after 10 attempts |
| **Contact Form Spam**| Bot bombards `/api/messages` with 5,000 spam emails | `express-rate-limit` restricts to 5 messages/hour |
| **Cross-Origin Cookie Block**| Browser blocks `httpOnly` JWT cookies from React app | `cors` configured with `credentials: true` & domain whitelist |

---

## 3. Deep Dive: The 5 Security Pillars

### Pillar 1: HTTP Security Headers with Helmet
Browsers rely on HTTP response headers to enforce security policies. **`helmet()`** automatically sets 15+ industry-standard security headers:
- **`Strict-Transport-Security (HSTS)`**: Forces browsers to strictly use HTTPS.
- **`X-Content-Type-Options: nosniff`**: Prevents browsers from guessing the MIME type (protects against drive-by downloads).
- **`X-Frame-Options: SAMEORIGIN`**: Blocks other websites from loading your site inside an `<iframe>` (prevents Clickjacking).
- **`X-XSS-Protection`**: Enables legacy browser XSS filters.

---

### Pillar 2: CORS with Credentials (`httpOnly` Cookie Support)
On Day 1, we initialized CORS with:
```javascript
app.use(cors()); // ❌ Allowed * (any domain) without credentials
```
Now that we authenticate using **`httpOnly` cookies**, web browsers enforce a strict security law:
> **The Browser Security Law**: A browser will **NEVER** attach or receive credentials/cookies if the server sets `Access-Control-Allow-Origin: *`.

To allow your React frontend (`localhost:5173` or Vercel) to log in and receive cookies, CORS must:
1. Whitelist the exact frontend domain (`http://localhost:5173`).
2. Explicitly set `credentials: true`.

---

### Pillar 3: Rate Limiting (DDoS & Brute-Force Defense)
Rate limiting tracks client IP addresses and blocks traffic that exceeds thresholds.
Instead of a single blanket limit, we use **Tiered Limiting**:
1. **Global API Limiter**: 200 requests per 10 minutes (prevents general server overload).
2. **Auth Limiter**: 10 login requests per 15 minutes (stops password guessing).
3. **Contact Form Limiter**: 5 messages per 1 hour (stops spam bots).

---

### Pillar 4: NoSQL Injection Defense (`mongo-sanitize`)
In SQL databases, attackers use `' OR 1=1 --`.
In MongoDB, Express parses JSON objects. An attacker could send:
```json
{
  "email": { "$gt": "" },
  "password": { "$gt": "" }
}
```
If not sanitized, MongoDB interprets `$gt: ""` as *"find any document where email is greater than empty string"*, returning your admin user without knowing the password!
`express-mongo-sanitize` recursively scans `req.body`, `req.query`, and `req.params`, stripping any keys that start with `$` or contain dots `.`.

---

### Pillar 5: Input Validation & Sanitization
Validating presence, lengths, and formats before hitting the database prevents garbage data, crashes, and buffer overflows.

---

## 4. Step-by-Step Implementation Guide

### Step 1: Install Security Packages
In your `server/` terminal:
```powershell
npm install helmet express-rate-limit express-mongo-sanitize
```

---

### Step 2: Create `server/middleware/rateLimit.js`
Inside `server/middleware/`, create `rateLimit.js`:

```javascript
const rateLimit = require('express-rate-limit');

// 1. Global API Limiter (applied to all requests)
const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 200, // Limit each IP to 200 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again after 10 minutes'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false
});

// 2. Strict Auth Limiter (Login attempts)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 attempts
    message: {
        success: false,
        error: 'Too many login attempts from this IP. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// 3. Contact Form Limiter (Spam prevention)
const messageLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Max 5 messages per hour per IP
    message: {
        success: false,
        error: 'Too many messages sent from this IP. Please wait an hour before contacting again.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    apiLimiter,
    authLimiter,
    messageLimiter
};
```

---

### Step 3: Update `server/.env`
Open [`server/.env`](file:///d:/Projects/Personal%20Portfolio/server/.env) and add `CLIENT_URL`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=doom_empire_super_secret_jwt_key_2026_keerthi_secure
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
```

---

### Step 4: Configure `server/server.js` with Full Security Suite

Open [`server/server.js`](file:///d:/Projects/Personal%20Portfolio/server/server.js) and update it with our security middleware:

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimit');
const errorHandler = require('./middleware/error');

// Route files
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const projectRoutes = require('./routes/projectRoutes');
const skillRoutes = require('./routes/skillRoutes');
const experienceRoutes = require('./routes/experienceRoutes');
const educationRoutes = require('./routes/educationRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Connect Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. CORS with Credentials & Domain Whitelisting
const allowedOrigins = [
    'http://localhost:5173', // Vite Frontend
    'http://localhost:3000', // React CRA
    process.env.CLIENT_URL   // Production Vercel domain
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS security policy'));
        }
    },
    credentials: true // Crucial: Allows httpOnly cookies across domains
}));

// 3. Body Parsers
app.use(express.json({ limit: '10kb' })); // Body limit prevents large payload DoS
app.use(cookieParser());

// 4. Sanitize against NoSQL Query Injection
app.use(mongoSanitize());

// 5. Apply Global Rate Limiting to all requests
app.use('/api', apiLimiter);

// 6. Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/messages', messageRoutes);

// Health Check Route
app.get('/', (req, res) => {
    res.send('Hello from Portfolio Backend!');
});

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello, World! Backend is secure and running.' });
});

// Central Error Handler (MUST BE LAST)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

---

### Step 5: Attach Specific Limiters to Routes

#### A. In [`server/routes/authRoutes.js`](file:///d:/Projects/Personal%20Portfolio/server/routes/authRoutes.js):
Attach `authLimiter` to the `/login` route:
```javascript
const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', register);
router.post('/login', authLimiter, login); // Protect login against brute-force!
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
```

#### B. In [`server/routes/messageRoutes.js`](file:///d:/Projects/Personal%20Portfolio/server/routes/messageRoutes.js):
Attach `messageLimiter` to the public contact form `POST /`:
```javascript
const express = require('express');
const router = express.Router();
const {
    getMessages,
    createMessage,
    toggleMessageRead,
    deleteMessage
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { messageLimiter } = require('../middleware/rateLimit');

router.route('/')
    .get(protect, getMessages)
    .post(messageLimiter, createMessage); // Protect contact form against spam!

router.route('/:id/read')
    .put(protect, toggleMessageRead);

router.route('/:id')
    .delete(protect, deleteMessage);

module.exports = router;
```

---

## 5. Line-by-Line Code Breakdown

### `express.json({ limit: '10kb' })`
By default, Express accepts large JSON bodies. If an attacker streams a 50MB JSON object to your `/api/messages` endpoint, it consumes RAM and blocks Node's single thread. Restricting payload limits to `10kb` safely accommodates form submissions while neutralizing JSON flood DoS attacks.

### `standardHeaders: true` in Rate Limiting
Instructs `express-rate-limit` to return official RFC draft headers:
- `RateLimit-Limit`: Maximum allowed requests.
- `RateLimit-Remaining`: How many calls you have left in the current window.
- `RateLimit-Reset`: Seconds remaining until the quota resets.

---

## 6. Postman Testing Matrix

### Test 1: Check Security Headers in Response
- Send `GET http://localhost:5000/api/projects` in Postman.
- Click the **Headers** tab in the bottom response pane.
- **Verification**: You will see:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `RateLimit-Limit: 200`
  - `RateLimit-Remaining: 199`

### Test 2: Test Rate Limiting on Login
- Send `POST http://localhost:5000/api/auth/login` rapidly 11 times.
- **On the 11th request**: You will receive `429 Too Many Requests`:
  ```json
  {
    "success": false,
    "error": "Too many login attempts from this IP. Please try again after 15 minutes."
  }
  ```

### Test 3: Test NoSQL Injection Defense
- Send `POST http://localhost:5000/api/auth/login` with:
  ```json
  {
    "email": { "$gt": "" },
    "password": "somepassword"
  }
  ```
- **Verification**: `mongoSanitize` strips `$gt`, converting the payload so it cannot inject database operators.

---

## 7. How Companies & Enterprises Maintain Production Security

1. **Redis-Backed Rate Limiting**:
   In cloud microservices running 10 clustered containers behind an AWS Application Load Balancer, `express-rate-limit`'s default in-memory store fails because each container tracks IP counts independently. Companies use **`rate-limit-redis`** so all server replicas share a single centralized Redis counter.
2. **Web Application Firewalls (WAF)**:
   Enterprises place **Cloudflare** or **AWS WAF** in front of their APIs to filter volumetric DDoS, SQL/NoSQL injections, and malicious bot traffic before packets even reach Node.js.
3. **Content Security Policy (CSP)**:
   Specifies exactly which domains scripts, styles, fonts, and 3D textures (`.glb`) can load from, completely blocking unauthorized external scripts.

---

## 8. Top Interview Questions & Deep Answers

### 🟢 Junior Level

#### Q1: What does `helmet` do in an Express application?
> **Answer**: `helmet` is a security middleware collection that sets well-known HTTP response headers (such as `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and `Content-Security-Policy`). These headers configure browser behavior to mitigate common vulnerabilities like Clickjacking, MIME sniffing, and Cross-Site Scripting (XSS).

#### Q2: What is the HTTP status code returned when a rate limit is exceeded?
> **Answer**: `429 Too Many Requests`. The response typically includes headers such as `Retry-After` or `RateLimit-Reset` indicating how many seconds the client must wait before making another request.

---

### 🟡 Mid-Level

#### Q3: Why does a browser block cross-origin requests when `cors({ credentials: true })` is paired with wildcard `origin: '*'`?
> **Answer**: According to the W3C CORS specification, sending credentials (cookies, HTTP authorization) with a wildcard origin `*` would allow *any* arbitrary third-party website on the internet to issue authenticated background requests on behalf of a logged-in user and read private data. The browser strictly refuses to expose response data unless the server explicitly names the exact requesting origin in `Access-Control-Allow-Origin`.

#### Q4: How does a NoSQL Injection attack work against MongoDB, and how does `express-mongo-sanitize` prevent it?
> **Answer**: MongoDB uses JSON query syntax where keys starting with `$` represent query operators (such as `$gt`, `$ne`, `$regex`). If an application passes unsanitized user JSON directly into Mongoose (e.g. `User.findOne(req.body)`), an attacker can supply `{ "password": { "$ne": "null" } }` to match records without knowing the password. `express-mongo-sanitize` prevents this by recursively stripping any key starting with `$` or containing a dot `.` from `req.body`, `req.query`, and `req.params`.

---

### 🔴 Senior Level

#### Q5: How would you prevent a Distributed Denial of Service (DDoS) attack that bypasses simple IP rate limiting via proxy rotation / botnets?
> **Answer**:
> 1. **Edge WAF & DDoS Mitigation**: Deploy Cloudflare / AWS Shield / Akamai to filter Layer 3/4 network floods and perform challenge evaluations (Cloudflare Turnstile / managed challenges) before traffic reaches the origin.
> 2. **Token Bucket & User-Based Rate Limiting**: Track requests by authenticated user ID (from JWT/session) in addition to IP address.
> 3. **Payload & Computation Bounds**: Restrict JSON body size (`limit: '10kb'`), set aggressive HTTP request timeouts, and implement pagination limits so heavy database queries cannot exhaust memory.
> 4. **Adaptive Behavioral Analysis**: Use anomaly detection to identify unnatural request cadences and temporarily challenge or throttle suspect CIDR IP blocks.
