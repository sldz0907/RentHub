const mssql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: true, 
        trustServerCertificate: true 
    }
};

const connectDB = async () => {
    try {
        const pool = await mssql.connect(dbConfig);
        console.log("=== SQL Server Connected Successfully ===");
        return pool;
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = { mssql, connectDB };
