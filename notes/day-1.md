# 📘 Day 1: Backend Foundation, Tooling, & Architecture

---

## 📑 Table of Contents
1. [Overview & Objectives](#1-overview--objectives)
2. [Project Architecture & Directory Structure](#2-project-architecture--directory-structure)
3. [Deep Dive: Configuration Files](#3-deep-dive-configuration-files)
   - [`package.json`](#a-packagejson)
   - [`.gitignore`](#b-gitignore)
   - [`.env`](#c-env)
4. [Line-by-Line Code Breakdown: `server.js`](#4-line-by-line-code-breakdown-serverjs)
5. [Core Concepts & Internals](#5-core-concepts--internals)
   - [HTTP Request-Response Lifecycle in Express](#http-request-response-lifecycle-in-express)
   - [Understanding Middleware Pipeline](#understanding-middleware-pipeline)
   - [CORS Mechanism Deep Dive](#cors-mechanism-deep-dive)
   - [CommonJS vs. ES Modules](#commonjs-vs-es-modules)
   - [Dependencies vs. DevDependencies](#dependencies-vs-devdependencies)
6. [How Companies & Enterprises Maintain This](#6-how-companies--enterprises-maintain-this)
7. [Comprehensive Interview Questions & Answers](#7-comprehensive-interview-questions--answers)

---

## 1. Overview & Objectives

On Day 1, we set up the server-side foundation for a full-stack portfolio application.

### Key Milestones Achieved:
- Initialized Node runtime environment.
- Configured modular architecture dividing `client/` and `server/`.
- Configured dependency management via `npm` and `package.json`.
- Implemented environment isolation with `dotenv`.
- Configured security middleware with `cors`.
- Handled incoming JSON payloads with Express native middleware.
- Created health check / baseline API routes (`GET /` and `GET /api/hello`).
- Configured developer ergonomics using `nodemon`.

---

## 2. Project Architecture & Directory Structure

```plaintext
Personal Portfolio/
├── client/                     # Frontend (React / Vite / Next.js / HTML-CSS)
├── server/                     # Backend API (Node.js + Express)
│   ├── node_modules/           # Downloaded external package code (DO NOT COMMIT)
│   ├── .env                    # Secret environment variables (DO NOT COMMIT)
│   ├── .gitignore              # Files git must ignore
│   ├── package.json            # Project manifest, dependencies & scripts
│   ├── package-lock.json       # Exact locked dependency tree & SHA integrity hashes
│   └── server.js               # Application entry point
├── notes/                      # Technical documentation & study guides
│   └── day-1.md                # Day 1 technical breakdown
└── Keerthi_Portfolio_2_Month_Plan.txt.pdf
```

### Why Decouple `client` and `server`?
1. **Independent Scaling**: The frontend can be hosted on high-speed static CDN edge servers (Vercel, Cloudflare Pages, Netlify), while the backend runs on serverful/containerized environments (AWS ECS, Render, Railway, DigitalOcean).
2. **Separation of Concerns**: Frontend engineers and backend engineers can work in the same repo (monorepo) or separate repos without conflicting dependencies.
3. **Security Boundary**: The backend contains sensitive business logic, database credentials, and API secret keys that must never be exposed to client-side bundles.

---

## 3. Deep Dive: Configuration Files

### A. `package.json`

```json
{
  "name": "server",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "cors": "^2.8.6",
    "dotenv": "^18.0.10",
    "express": "^5.3.0",
    "mongoose": "^9.12.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.14"
  }
}
```

#### Detailed Breakdown of Fields:
- `"name"`: Identifier of your package/service.
- `"version"`: Follows **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`.
  - `MAJOR`: Breaking breaking changes.
  - `MINOR`: New backwards-compatible functionality.
  - `PATCH`: Backwards-compatible bug fixes.
- `"scripts"`: Aliases for shell commands executed via `npm run <script-name>`:
  - `"start": "node server.js"`: Standard production command. Cloud platforms (Render, Heroku, AWS) automatically execute `npm start`.
  - `"dev": "nodemon server.js"`: Development command that wraps `server.js` with a file-watcher to reload on save.
- `"type": "commonjs"`: Specifies the module resolution system. Node defaults to `require()` and `module.exports`. If set to `"module"`, Node uses modern ES modules (`import`/`export`).
- Caret `^` symbol (e.g., `^5.3.0`): Permits automatic minor and patch updates when running `npm update` (accepts `>=5.3.0 <6.0.0`), preventing automatic breaking changes from major version bumps.

---

### B. `.gitignore`

```plaintext
node_modules
.env
```

#### Why are these ignored?
1. **`node_modules`**:
   - Contains thousands of third-party files (often 100MB - 500MB+).
   - Platform-dependent binaries (C++ native addons compiled during installation on Windows won't run directly on a Linux deployment server).
   - Anyone cloning the repo can recreate the exact identical `node_modules` instantly by executing `npm install`, which reads `package-lock.json`.
2. **`.env`**:
   - Stores unencrypted secrets: database connection strings, passwords, private JWT keys, payment gateway tokens.
   - Pushing `.env` to GitHub exposes credentials to scrapers and botnets within seconds.

---

### C. `.env`

```env
PORT=5000
```

#### Purpose:
- Implements Principle III of the **Twelve-Factor App Methodology**: *Store config in the environment*.
- In local development, `PORT` is `5000`. In production, cloud platforms inject their own dynamic port (e.g., `PORT=80` or an internal ephemeral port like `PORT=10000`).

---

## 4. Line-by-Line Code Breakdown: `server.js`

Here is the exact code in `server/server.js`:

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test "Hello" Route
app.get('/', (req, res) => {
    res.send('Hello from Portfolio Backend!');
});

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello, World! Backend is running' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### Deep Analysis of Every Line:

#### Line 1: `const express = require('express');`
- **What it does**: Imports the Express framework module into memory using CommonJS syntax.
- **Under the hood**: The `require` function locates the `express` directory inside `node_modules`, reads its entry file, executes it within a module wrapper, and returns an export function that can construct an Express application.

#### Line 2: `const cors = require('cors');`
- **What it does**: Imports the Cross-Origin Resource Sharing middleware.
- **Under the hood**: It provides a function that inspects incoming HTTP request headers and sets appropriate `Access-Control-Allow-*` HTTP response headers.

#### Line 3: `require('dotenv').config();`
- **What it does**: Executes `dotenv`'s initialization function.
- **Under the hood**: It synchronously reads the `.env` file from the root of the project directory, parses the key-value pairs (e.g. `PORT=5000`), and injects them directly into Node's global `process.env` object. Must be called as early as possible so subsequent imports can access environment variables.

#### Line 5: `const app = express();`
- **What it does**: Instantiates the Express application object.
- **Under the hood**: `app` is technically a JavaScript function designed to be passed to Node's native `http.createServer()`. Express mixes in dozens of routing methods (`.get`, `.post`, `.use`, `.listen`) and an internal middleware dispatch stack.

#### Line 6: `const PORT = process.env.PORT || 5000;`
- **What it does**: Retrieves the port number from the environment, with a fallback.
- **Under the hood**: Uses the logical OR (`||`) operator. If `process.env.PORT` is undefined (e.g., if `.env` is missing or the variable isn't set), it defaults safely to `5000`.

#### Line 9: `app.use(cors());`
- **What it does**: Mounts the CORS middleware globally for all incoming requests.
- **Under the hood**: By default, `cors()` sets `Access-Control-Allow-Origin: *`, allowing web browsers from any domain (e.g., `localhost:3000` or `localhost:5173`) to make fetch/axios requests to this backend without being blocked by browser Same-Origin Policy.

#### Line 10: `app.use(express.json());`
- **What it does**: Built-in middleware for parsing JSON payloads.
- **Under the hood**: Node's HTTP server receives incoming request bodies as raw asynchronous byte streams (`Buffer`). `express.json()` listens for incoming chunks of data, buffers them, parses the raw string into a native JavaScript object with `JSON.parse()`, and assigns it to `req.body`. Without this line, `req.body` will be `undefined` on `POST`/`PUT` requests.

#### Lines 13-15:
```javascript
app.get('/', (req, res) => {
    res.send('Hello from Portfolio Backend!');
});
```
- **What it does**: Registers a route handler for HTTP `GET` requests sent to the root path (`/`).
- **Under the hood**:
  - `req` (Request object): Represents the incoming HTTP request (headers, query params, client IP, path).
  - `res` (Response object): Provides methods to format and transmit the HTTP response back to the client.
  - `res.send()`: Express automatically sets the `Content-Type` header to `text/html; charset=utf-8`, computes the `Content-Length` header, and flushes the TCP socket.

#### Lines 17-19:
```javascript
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello, World! Backend is running' });
});
```
- **What it does**: Exposes an API endpoint returning a JSON document.
- **Under the hood**: `res.json()` serializes the JavaScript object into a JSON string via `JSON.stringify()`, automatically sets the HTTP header `Content-Type: application/json; charset=utf-8`, and sends the response with default status `200 OK`.

#### Lines 22-24:
```javascript
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```
- **What it does**: Binds and listens for incoming connections on the specified port.
- **Under the hood**: Express calls Node's native `http.createServer(app).listen(PORT)`. The operating system opens a TCP socket bound to that port. Once the socket is actively listening, the event loop fires the provided callback function, printing the message to the console.

---

## 5. Core Concepts & Internals

### HTTP Request-Response Lifecycle in Express
```
Client Request (Browser / Postman)
       │
       ▼
[OS Network Socket: Port 5000]
       │
       ▼
[Node.js Event Loop & http.Server]
       │
       ▼
[Express Application Pipeline]
       │
       ├──► Middleware 1: cors()               (Adds Access-Control headers)
       │
       ├──► Middleware 2: express.json()       (Parses incoming body to req.body)
       │
       ├──► Route Matching: GET /api/hello    (Matches URL & HTTP Verb)
       │
       └──► Handler Execution: res.json(...)  (Serializes & formats payload)
       │
       ▼
[OS TCP Response transmission]
       │
       ▼
Client Receives HTTP 200 OK + JSON
```

### Understanding Middleware Pipeline
In Express, middleware functions have access to the request object (`req`), the response object (`res`), and the `next` function in the application’s request-response cycle:
```javascript
function myCustomMiddleware(req, res, next) {
    // 1. Inspect or modify req / res
    console.log(`${req.method} request made to: ${req.url}`);
    
    // 2. Either end the request:
    // res.status(403).send("Forbidden");
    
    // 3. Or pass control to the next handler in line:
    next();
}
```
If a middleware neither calls `res.send()`/`res.json()` nor calls `next()`, the client request will **hang** indefinitely until timing out.

### CORS Mechanism Deep Dive
Browsers enforce a strict security policy known as the **Same-Origin Policy (SOP)**. 
- An origin is defined by: `protocol + domain + port` (e.g., `http://localhost:3000`).
- If your React frontend is on `http://localhost:3000` and attempts to call `http://localhost:5000/api/hello`, the browser considers this a cross-origin request.
- The browser checks the response headers sent by the backend:
  - If `Access-Control-Allow-Origin` is present and matches the caller (or `*`), the browser allows JavaScript to read the response.
  - If missing, the browser blocks the response and throws a CORS error in the browser console.

### CommonJS vs. ES Modules
| Feature | CommonJS (CJS) | ES Modules (ESM) |
| :--- | :--- | :--- |
| **Syntax** | `const pkg = require('pkg')` / `module.exports = ...` | `import pkg from 'pkg'` / `export default ...` |
| **Loading** | Synchronous (blocking) | Asynchronous (non-blocking) |
| **Standard** | Node.js legacy standard (2009) | Official ECMAScript official standard (ES6/2015) |
| **Top-level await** | Not supported natively without async wrapper | Supported natively |
| **Default in Node** | Default unless `"type": "module"` in `package.json` | Requires `"type": "module"` or `.mjs` extension |

### Dependencies vs. DevDependencies
- **`dependencies`** (`npm i <package>`): Required to run the application in production (e.g., `express`, `mongoose`, `cors`, `dotenv`). Without them, the deployed server crashes.
- **`devDependencies`** (`npm i -D <package>`): Tools only needed during development by the programmer (e.g., `nodemon`, `eslint`, `prettier`, `jest`). In production deployments, CI/CD runners can run `npm install --omit=dev` to save disk space, memory, and build time.

---

## 6. How Companies & Enterprises Maintain This

In real tech companies and production architectures, production-grade Node.js backends follow strict standards:

### 1. Layered Folder Architecture (Separation of Concerns)
Instead of keeping everything in `server.js`, enterprise codebases follow an MVC or Service-Repository pattern:
```plaintext
server/
├── config/             # Database connection, environment config
│   └── db.js
├── controllers/        # Request handling & HTTP response logic
│   └── userController.js
├── models/             # Mongoose schemas & database definitions
│   └── User.js
├── routes/             # Route endpoints & URL mapping
│   └── userRoutes.js
├── middlewares/        # Custom auth checks, validation, error handlers
│   └── authMiddleware.js
│   └── errorHandler.js
├── services/           # Reusable business logic (pure JS functions)
│   └── emailService.js
├── utils/              # Helper utilities, constants, loggers
└── server.js           # Server bootstrap only
```

### 2. Strict Centralized Error Handling
Companies never let exceptions crash the process unhandled. An enterprise app always includes a global error handler middleware as the last middleware:
```javascript
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
```

### 3. Strict CORS Whitelisting
In production, companies **never** use `app.use(cors())` with wildcard `*`. They restrict access explicitly to trusted domains:
```javascript
const allowedOrigins = ['https://myportfolio.com', 'https://admin.myportfolio.com'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS security policy'));
        }
    },
    credentials: true
}));
```

### 4. Structured Logging (Not `console.log`)
Enterprises replace `console.log` with production loggers like **Winston** or **Pino**. Logs are output in JSON format so observability tools (Datadog, AWS CloudWatch, Logstash) can index, alert, and search them.

### 5. Process Managers & Containerization
In production, `nodemon` is never used. Applications run in:
- **Docker containers** orchestrated by Kubernetes or AWS ECS.
- Or managed by process managers like **PM2** to automatically cluster across multiple CPU cores and restart if a fatal crash occurs.

---

## 7. Comprehensive Interview Questions & Answers

### 🟢 Junior Level

#### Q1: What is the difference between `npm install <pkg>` and `npm install -D <pkg>`?
> **Answer**: `npm install <pkg>` installs the package under `dependencies`, meaning it is essential for the application to run in production (e.g., Express, Mongoose). `npm install -D <pkg>` installs it under `devDependencies`, meaning it is only utilized during development for developer tooling, linting, testing, or reloading (e.g., Nodemon, Jest). Production environments can omit devDependencies using `npm install --omit=dev`.

#### Q2: What does `express.json()` do, and what happens if you forget to use it?
> **Answer**: `express.json()` is a built-in middleware that intercepts incoming HTTP requests with a `Content-Type: application/json` header. It collects the streamed binary data chunks from the network buffer, parses them into a JavaScript object using `JSON.parse()`, and assigns it to `req.body`. If omitted, any attempt to access `req.body` on a POST or PUT request will evaluate to `undefined`.

#### Q3: Why do we need the `dotenv` package?
> **Answer**: In software development, sensitive keys, database URLs, and port numbers should not be hardcoded in source files for security and environment parity reasons. `dotenv` reads a local `.env` file and populates Node's `process.env` global object, allowing developers to configure applications dynamically per environment (development, staging, production) without altering code.

---

### 🟡 Mid-Level

#### Q4: Explain the difference between `res.send()` and `res.json()`.
> **Answer**:
> - `res.send()` is a polymorphic response helper. Depending on the data type passed (string, buffer, object, boolean), it infers and assigns the `Content-Type` header (e.g., `text/html` for strings). If an object or array is passed, it delegates internally to `res.json()`.
> - `res.json()` explicitly forces the `Content-Type` header to `application/json; charset=utf-8` and serializes the parameter with `JSON.stringify()`, handling formatting of nullish values and special characters correctly according to JSON standards.

#### Q5: What is CORS, and why is it enforced by the browser rather than the server?
> **Answer**: CORS (Cross-Origin Resource Sharing) is a browser security mechanism based on the Same-Origin Policy. It prevents malicious scripts executing on one domain (e.g., `evil-site.com`) from reading sensitive data requested from another domain (e.g., `bank.com`) using the user's authenticated session or cookies. The server actually processes the request, but the browser inspects the response headers (`Access-Control-Allow-Origin`); if the requesting origin is not explicitly authorized, the browser blocks client-side JavaScript access to that response.

#### Q6: What is `package-lock.json` and why should it ALWAYS be committed to Git?
> **Answer**: While `package.json` specifies version ranges using symbols like `^` or `~`, `package-lock.json` records the exact resolved dependency tree, including every sub-dependency, exact version numbers, and cryptographic integrity hashes (SHA-512). Committing it guarantees deterministic installs across all team members' machines and deployment servers, preventing "works on my machine" bugs caused by upstream third-party updates.

---

### 🔴 Senior Level

#### Q7: In `server.js`, how does Node.js handle incoming HTTP connections under the hood without blocking other requests?
> **Answer**: Node.js utilizes an event-driven, single-threaded architecture powered by the `libuv` event loop and the OS kernel. When `app.listen()` is executed, the OS opens a non-blocking network socket. Incoming TCP requests are queued by the OS kernel. Node registers an I/O event listener with the OS (e.g., via `epoll` on Linux, `kqueue` on macOS, or `IOCP` on Windows). When network data is received, the kernel signals the event loop, which places the callback into the event queue. The single main thread executes the JavaScript middleware pipeline. Because heavy I/O is delegated to the operating system asynchronously, thousands of concurrent connections can be managed without spawning a thread per request.

#### Q8: What security risks arise if you put `app.use(cors())` with default configuration in a production application handling user sessions?
> **Answer**: By default, `cors()` sets `Access-Control-Allow-Origin: *`. If your backend relies on cookie-based authentication or sessions:
> 1. Modern browsers block requests with credentials (`cookies`, `Authorization` headers) when the origin header is set to `*`.
> 2. If misconfigured with `credentials: true` alongside dynamically reflecting any incoming `Origin` header, any arbitrary website visited by an authenticated user could issue authenticated AJAX requests to your backend and extract private user data, exposing the application to Cross-Site Request Forgery (CSRF) and data theft. In production, origins must be strictly validated against a hard whitelist.

