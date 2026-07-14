const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sequelize } = require('../config/db');
const { sendPasswordResetEmail } = require('../services/emailService');

// Registration Logic
router.post('/register', async (req, res) => {
    const { full_name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await sequelize.query(
            "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)",
            { replacements: [full_name, email, hashedPassword] }
        );

        // ONLY send email if in production, or if you have a local email test server
        if (process.env.NODE_ENV === 'production') {
            await sendWelcomeEmail({ name: full_name, email: email });
        } else {
            console.log("Development mode: Welcome email skipped for " + email);
        }

        res.status(201).json({ message: "Account created successfully! Welcome to the Rebirth of a Queen family." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Registration failed: Email may already be in use." });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find the user by email
        const [users] = await sequelize.query("SELECT * FROM users WHERE email = ?", { replacements: [email] });
        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // SAVE USER DATA TO SESSION
        // This makes the user "logged in" across your entire site
        req.session.userId = user.id;
        req.session.role = user.role; 
        req.session.save((err) => { // Force the session to save to the store
            if (err) console.error("Session save error:", err);
            console.log("Session saved! Role is:", req.session.role);
        });

        // Determine Redirect URL based on role
        const redirectUrl = user.role === 'admin' ? '/admin-dashboard' : '/';

        res.status(200).json({ 
            message: "Login successful!", 
            redirectUrl: redirectUrl 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during login." });
    }
});


// Forgot Password Logic
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [user] = await sequelize.query("SELECT id FROM users WHERE email = ?", { replacements: [email] });
        
        if (user.length > 0) {
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 3600000); // 1 hour

            await sequelize.query(
                "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
                { replacements: [user[0].id, token, expires] }
            );

            const resetUrl = `${process.env.BASE_URL}/reset-password?token=${token}`;
            await sendPasswordResetEmail(email, resetUrl);
        }
        res.send("If an account exists, a reset link has been sent to your email.");
    } catch (error) {
        res.status(500).send("Error processing request.");
    }
});

module.exports = router;