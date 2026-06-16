const { connectDB } = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

async function seedAdmin() {
    try {
        await connectDB();
        
        const username = 'admin';
        const email = 'admin@gmail.com';
        const password = '123456';
        
        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            console.log('Admin account already exists. Updating password and role just in case.');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            existingAdmin.password = hashedPassword;
            existingAdmin.role = 'ADMIN';
            await existingAdmin.save();
            
            console.log('Admin account updated.');
            mongoose.connection.close();
            process.exit(0);
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await User.create({
            username,
            password: hashedPassword,
            email,
            phone: '0123456789',
            role: 'ADMIN',
            is_active: true
        });
        
        console.log('Admin account created successfully.');
        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        mongoose.connection.close();
        process.exit(1);
    }
}

seedAdmin();
