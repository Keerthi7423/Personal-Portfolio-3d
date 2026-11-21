const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const projectRoutes = require('./routes/projectRoutes');
const skillRoutes = require('./routes/skillRoutes');
const experienceRoutes = require('./routes/experienceRoutes');
const educationRoutes = require('./routes/educationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const errorHandler = require('./middleware/error');
const profileRoutes = require('./routes/profileRoutes');

// Connect Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/messages', messageRoutes);

// Test Routes
app.get('/', (req, res) => {
    res.send('Hello from Portfolio Backend!');
});

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello, World! Backend is running' });
});

// Central Error Handler (MUST BE LAST)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});