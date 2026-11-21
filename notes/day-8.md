# 📘 Day 8: Authentication Fundamentals — Bcrypt Hashing & JWT (JSON Web Tokens)

---

## 📑 Table of Contents
1. [Overview & Day 8 Goals](#1-overview--day-8-goals)
2. [Why We NEVER Store Plaintext Passwords](#2-why-we-never-store-plaintext-passwords)
3. [Deep Dive: Hashing vs. Encryption vs. Encoding](#3-deep-dive-hashing-vs-encryption-vs-encoding)
4. [How Bcrypt Works Under the Hood](#4-how-bcrypt-works-under-the-hood)
   - [What is a Salt?](#what-is-a-salt)
   - [Computational Cost / Work Factor (Salt Rounds)](#computational-cost--work-factor-salt-rounds)
   - [Why Bcrypt Resists GPU Brute-Force Attacks](#why-bcrypt-resists-gpu-brute-force-attacks)
5. [How JSON Web Tokens (JWT) Work](#5-how-json-web-tokens-jwt-work)
   - [Anatomy of a JWT: Header, Payload, Signature](#anatomy-of-a-jwt-header-payload-signature)
   - [How the Signature Proves Authenticity](#how-the-signature-proves-authenticity)
   - [Stateless Auth (JWT) vs. Stateful Auth (Sessions)](#stateless-auth-jwt-vs-stateful-auth-sessions)
6. [Step-by-Step Hands-On Lab](#6-step-by-step-hands-on-lab)
   - Step 1: Install `bcryptjs` and `jsonwebtoken`
   - Step 2: Configure Environment Variables (`.env`)
   - Step 3: Build the Interactive Scratch Experiment (`scratch-auth.js`)
   - Step 4: Run & Analyze the Security Output
7. [How Companies & Enterprises Handle Authentication](#7-how-companies--enterprises-handle-authentication)
8. [Top Interview Questions & Deep Answers](#8-top-interview-questions--deep-answers)

---

## 1. Overview & Day 8 Goals

According to your 2-month plan for **Monday (Week 2, Day 8)**:
> *"Learn how JWT and bcrypt work. Experiment in a scratch file: hash a password, compare, sign and verify a token."*

Before building the `Admin` model and registration/login routes on Day 9, today we master the **cryptographic foundations** that secure modern web applications.

### Key Milestones Today:
- Understand password security, cryptographic salts, and one-way hashing.
- Master `bcrypt.hash()` and `bcrypt.compare()`.
- Demystify JSON Web Tokens (JWT) and HMAC SHA-256 signing.
- Execute an interactive scratch lab verifying both valid logins and tampered tokens.
- Add secure JWT secrets to `.env`.

---

## 2. Why We NEVER Store Plaintext Passwords

If a database stores passwords as plain strings (e.g. `"password123"`):
1. **Insider Threats**: Any developer, DBA, or cloud engineer with database read access can see every user's password.
2. **Database Leaks / SQL Injections**: If an attacker breaches the database, millions of accounts across multiple services are instantly compromised because users reuse passwords.
3. **Legal Compliance**: Storing plaintext passwords violates GDPR, HIPAA, SOC 2, and PCI-DSS, resulting in multi-million dollar regulatory fines.

---

## 3. Deep Dive: Hashing vs. Encryption vs. Encoding

These three terms are frequently confused in technical interviews:

| Concept | Reversible? | Requires a Key? | Purpose | Example |
| :--- | :--- | :--- | :--- | :--- |
| **Encoding** | **Yes** (Trivial) | No | Transforming data formats for safe transport over networks. | Base64, URL Encoding (`%20`) |
| **Encryption** | **Yes** (With key) | Yes | Confidentiality. Scrambling sensitive data so only authorized key-holders can decrypt it. | AES-256, RSA (Credit cards, messages) |
| **Hashing** | **NO** (One-way) | No | Data integrity and password verification. Mathematically impossible to reverse. | Bcrypt, SHA-256, Argon2 |

> 💡 **Golden Rule**: Passwords are **never encrypted** (because encryption can be decrypted). Passwords are always **hashed**.

---

## 4. How Bcrypt Works Under the Hood

Bcrypt is an adaptive cryptographic hash function based on the Blowfish cipher:

```
User Password: "DoomMasterPassword!"
             │
             ├──► + Random Cryptographic Salt (e.g. "$2a$10$N9qo8uLOickgx2ZMRZoMye")
             │
             ▼
   [Bcrypt Iteration Loop: 2^10 = 1,024 rounds]
             │
             ▼
Result: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
```

### What is a Salt?
A **salt** is a cryptographically secure random string concatenated with the password before hashing.
- **Why it matters**: If User A and User B both choose the password `"secret123"`, a standard hash (like MD5) produces identical hashes. Attackers use precomputed lookup tables called **Rainbow Tables** to crack millions of hashes in seconds.
- With a unique salt per user, even if two users have the same password, their final bcrypt hashes are **completely different**.

### Computational Cost / Work Factor (Salt Rounds)
Notice the `10` in `bcrypt.genSalt(10)`:
- It represents $2^{10} = 1,024$ internal key expansion rounds.
- If hardware gets faster in the future, you simply raise the work factor to `12` ($2^{12} = 4,096$ rounds) to make hashing slower.
- By design, bcrypt is computationally expensive (takes ~80ms-150ms per hash), making GPU brute-force cracking virtually impossible.

### How `bcrypt.compare()` Works:
Since hashes cannot be decrypted, how do we verify a login password?
1. The user types `"DoomMasterPassword!"`.
2. `bcrypt.compare` extracts the salt from the stored hash.
3. It hashes the newly entered password with the *exact same salt*.
4. It compares the two resulting hashes in constant time ($O(1)$) to prevent timing attacks.

---

## 5. How JSON Web Tokens (JWT) Work

JWT is an open standard (RFC 7519) for securely transmitting information between parties as a compact JSON object.

A JWT consists of **three parts separated by dots (`.`)**:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZmEzOCIsImlhdCI6MTY5...p92ldGxad68LJZ
└─────────────────┬─────────────────┘ └──────────────────┬─────────────────┘ └───────┬───────┘
            1. HEADER                              2. PAYLOAD                   3. SIGNATURE
```

### 1. Header
Contains token type and signing algorithm (typically `HS256` = HMAC using SHA-256).
```json
{ "alg": "HS256", "typ": "JWT" }
```

### 2. Payload (Claims)
Contains user data and expiration timestamps. **Anyone can read this** (it is only Base64Url encoded, NOT encrypted!). Never store passwords or secrets here:
```json
{
  "id": "673f820ab1e48c12",
  "iat": 1700000000,
  "exp": 1702592000
}
```

### 3. Signature
The cryptographic seal that proves the token was created by your server and has **not been tampered with**:
```
Signature = HMACSHA256(
    base64UrlEncode(header) + "." + base64UrlEncode(payload),
    process.env.JWT_SECRET
)
```

### What happens if an attacker modifies the payload?
If a hacker alters the payload from `"role": "guest"` to `"role": "admin"`:
- The token's header and payload no longer match the signature.
- When your server verifies the token with `jwt.verify(token, JWT_SECRET)`, the cryptographic math fails immediately, and the server rejects the request with `JsonWebTokenError: invalid signature`!

---

## 6. Step-by-Step Hands-On Lab

### Step 1: Install Dependencies
In your `server/` terminal:
```bash
npm install bcryptjs jsonwebtoken
```

> 💡 **Why `bcryptjs` instead of `bcrypt`?**
> Standard `bcrypt` requires Python and C++ build tools installed on your Windows machine to compile native binaries. `bcryptjs` is pure JavaScript, 100% compatible, and installs without any C++ compilation errors!

---

### Step 2: Configure Environment Variables
Open [`server/.env`](file:///d:/Projects/Personal%20Portfolio/server/.env) and add your secret keys:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=doom_empire_super_secret_jwt_key_2026_keerthi_secure
JWT_EXPIRE=30d
```

---

### Step 3: Build the Interactive Scratch Experiment

Inside `server/`, create a file named `scratch-auth.js`:

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const runAuthExperiment = async () => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔐 EXPERIMENT 1: BCRYPT PASSWORD HASHING & COMPARISON');
    console.log('═══════════════════════════════════════════════════════════');

    const rawPassword = 'DoomMasterPassword2026!';
    console.log(`1. Raw Password: "${rawPassword}"`);

    // Generate Salt & Hash
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    console.log(`2. Generated Salt: ${salt}`);
    console.log(`3. Hashed Password: ${hashedPassword}`);
    console.log(`   (Notice: The hash is 60 characters and starts with $2a$10$)`);

    // Comparison 1: Correct Password
    const isMatchCorrect = await bcrypt.compare(rawPassword, hashedPassword);
    console.log(`4. Compare with CORRECT password: ${isMatchCorrect ? '✅ MATCH (Login Allowed)' : '❌ DENIED'}`);

    // Comparison 2: Wrong Password
    const isMatchWrong = await bcrypt.compare('WrongPassword123', hashedPassword);
    console.log(`5. Compare with WRONG password:   ${isMatchWrong ? '✅ MATCH (Login Allowed)' : '❌ DENIED (Invalid Credentials)'}\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎫 EXPERIMENT 2: JSON WEB TOKEN (JWT) SIGN & VERIFY');
    console.log('═══════════════════════════════════════════════════════════');

    const fakeUserId = '673892a0912fbc1200112233';
    const secretKey = 'my_super_secret_key';

    // 1. Sign Token
    const token = jwt.sign(
        { id: fakeUserId, role: 'admin' },
        secretKey,
        { expiresIn: '30d' }
    );
    console.log(`1. Generated JWT Token:\n   ${token}\n`);

    // 2. Decode & Inspect without secret
    const decodedPayload = jwt.decode(token);
    console.log('2. Decoded Payload (Readable by anyone):', decodedPayload);

    // 3. Verify with correct secret
    try {
        const verified = jwt.verify(token, secretKey);
        console.log(`3. Verify with CORRECT secret: ✅ Verified! User ID is: ${verified.id}`);
    } catch (err) {
        console.error('3. Verify failed:', err.message);
    }

    // 4. Simulate Hack / Tampering
    console.log('\n4. Simulating Hacker Tampering:');
    const tamperedToken = token.slice(0, -5) + 'AAAAA'; // Modify last 5 characters
    try {
        jwt.verify(tamperedToken, secretKey);
        console.log('   Hacked token was accepted! ❌ (Should not happen)');
    } catch (err) {
        console.log(`   Hacked token caught! 🛡️  Error: "${err.message}" (Request Rejected!)`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 EXPERIMENT COMPLETE: Security concepts verified!');
    console.log('═══════════════════════════════════════════════════════════');
};

runAuthExperiment();
```

---

### Step 4: Run the Script
In your terminal inside `server/`:
```bash
node scratch-auth.js
```

---

## 7. How Companies & Enterprises Handle Authentication

1. **HttpOnly, Secure Cookies**:
   - In single-page apps, storing tokens in `localStorage` leaves tokens vulnerable to **Cross-Site Scripting (XSS)**. Any third-party script can steal `localStorage.getItem('token')`.
   - Enterprises store JWTs inside **`httpOnly` cookies** (`res.cookie('token', token, { httpOnly: true, secure: true })`). JavaScript cannot read `httpOnly` cookies, eliminating XSS token theft!
2. **Access Token + Refresh Token Pattern**:
   - Short-lived Access Token (15 minutes).
   - Long-lived Refresh Token (7–30 days) stored in a secure database table that can be revoked if a device is stolen.
3. **Argon2 vs. Bcrypt**:
   - Bcrypt is the gold standard for web development. Highly sensitive security institutions (OWASP recommended) also use **Argon2id** because it is memory-hard and resists ASIC/FPGA hardware attacks.

---

## 8. Top Interview Questions & Deep Answers

### 🟢 Junior Level

#### Q1: What is the difference between Authentication and Authorization?
> **Answer**:
> - **Authentication (AuthN)**: Answering *"Who are you?"* (e.g. verifying email and password).
> - **Authorization (AuthZ)**: Answering *"What are you allowed to do?"* (e.g. checking if an authenticated user has the `admin` role to edit a project or delete a message).

#### Q2: Can you reverse a bcrypt hash back into the plain password?
> **Answer**: No. Bcrypt is a one-way cryptographic hash function. It is mathematically designed to be irreversible. Verification is done by hashing the entered candidate password with the original salt and comparing the outputs.

---

### 🟡 Mid-Level

#### Q3: Why is storing JWTs in `localStorage` considered a security vulnerability, and what is the recommended alternative?
> **Answer**: `localStorage` is accessible to any JavaScript running on the domain. If the application has an XSS vulnerability (e.g. an injected `<script>` tag or compromised npm package), an attacker can extract the token and hijack the user session. The recommended solution is sending the JWT in a cookie with the `httpOnly: true`, `secure: true`, and `sameSite: 'strict'` flags, preventing client-side JavaScript access.

#### Q4: Why is a salt needed in password hashing if hashing algorithms are already one-way?
> **Answer**: Without a salt, identical passwords always yield identical hashes. Attackers use precomputed hash tables (Rainbow Tables) to crack passwords instantly. A cryptographic salt ensures that even if two users share the same password, their final hashes are unique, forcing attackers to brute-force each account individually at massive computational cost.

---

### 🔴 Senior Level

#### Q5: Since JWTs are stateless, how do you immediately revoke a compromised user token before its expiration?
> **Answer**: Because JWT verification occurs mathematically without checking a database, standard JWTs cannot be revoked instantly. Enterprise solutions implement:
> 1. **Short Token Lifespans**: Set `expiresIn` to 10–15 minutes, limiting the attack window.
> 2. **Token Blacklisting with Redis**: On logout or security alert, push the token's JTI (JWT ID) or signature into an in-memory Redis cache with a TTL equal to the token's remaining lifespan. The auth middleware checks Redis before granting access.
> 3. **Token Versioning / Password Changed Timestamp**: Store a `tokenVersion` or `passwordChangedAt` field in the database. When a password changes, increment `tokenVersion`. If the token payload's version is older than the database version, reject the request.
