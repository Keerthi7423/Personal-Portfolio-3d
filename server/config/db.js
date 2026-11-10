const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected : ${conn.connection.host}`);
    } catch (error){
        console.error(`Mongodb Connection Error: ${error.message}`);

        //Exit process failure (1) so the server fails fast

        process.exit(1);
    }
};

module.exports = connectDB;