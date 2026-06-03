const { connectDB, mssql } = require('./config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedAdmin() {
    try {
        await connectDB();
        
        const username = 'admin';
        const email = 'admin@gmail.com';
        const password = '123456';
        
        const check = await mssql.query`SELECT * FROM Users WHERE email = ${email}`;
        if (check.recordset.length > 0) {
            console.log('Admin account already exists. Updating password and role just in case.');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            await mssql.query`
                UPDATE Users SET password = ${hashedPassword}, role = 'ADMIN' WHERE email = ${email}
            `;
            console.log('Admin account updated.');
            process.exit(0);
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await mssql.query`
            INSERT INTO Users (username, password, email, phone, role, is_active) 
            VALUES (${username}, ${hashedPassword}, ${email}, '0123456789', 'ADMIN', 1)
        `;
        
        console.log('Admin account created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
