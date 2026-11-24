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