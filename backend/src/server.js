const app = require('./app');
const { connectDB } = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to SQL Server database first
        await connectDB();
        
        // Start listening to incoming requests
        app.listen(PORT, () => {
            console.log(`========================================================`);
            console.log(`  🚀 RentHub Backend Server is Running on Port ${PORT}`);
            console.log(`  🔗 Local API URL: http://localhost:${PORT}`);
            console.log(`========================================================`);
        });
    } catch (error) {
        console.error("Critical: Failed to start the backend server:", error.message);
        process.exit(1);
    }
};

startServer();
