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

// 2. CORS with Credentials & Domain Whitelist
const allowedOrigins = [
    'http://localhost:5173', // Vite Frontend
    'http://localhost:3000', // React CRA
    process.env.CLIENT_URL   // Production domain
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS security policy'));
        }
    },
    credentials: true // Crucial: Allows httpOnly cookies across domains
}));

// 3. Body Parsers
app.use(express.json({ limit: '10kb' })); // Restrict payload size against flood attacks
app.use(cookieParser());

// 4. Sanitize against NoSQL Query Injection
app.use(mongoSanitize());

// 5. Global Rate Limiter for all API endpoints
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