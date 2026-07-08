const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');
const nodemailer = require('nodemailer');

router.get('/test', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).send("Test route disabled in production.");
    }

    const results = {
        database: 'Pending',
        email: 'Pending',
        dummyData: 'Pending'
    };

    // 1. Test Database
    try {
        await sequelize.authenticate();
        results.database = 'Connected successfully';
    } catch (err) {
        results.database = 'Failed: ' + err.message;
    }

    // 2. Test Email Server
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        await transporter.verify();
        results.email = 'Connected successfully';
    } catch (err) {
        results.email = 'Failed: ' + err.message;
    }

    // 3. Test Database Write (Dummy User)
    try {
        await sequelize.query(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            { replacements: ['Test User', 'test@example.com', 'hashed_pass_123', 'user'] }
        );
        results.dummyData = 'Dummy user added successfully';
    } catch (err) {
        results.dummyData = 'Failed: ' + err.message;
    }

    res.json(results);
});

module.exports = router;