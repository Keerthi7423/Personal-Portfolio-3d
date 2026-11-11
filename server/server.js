const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const projectRoutes = require('./routes/projectRoutes');

//Connect the database
connectDB();

const app = express();
const PORT = process.env.PORT;

//Middleware
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/projects', projectRoutes);

//Test "Hello" Route
app.get('/', (req,res) => {
    res.send('Hello from Portfolio Backend!');
});

app.get('/api/hello', (req,res) => {
    res.json({ message: 'Hello,World! Backend is running'});
});

//Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});