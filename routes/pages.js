const express = require('express');
const router = express.Router();

// Home Route
router.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
});

// About Route
router.get('/about', (req, res) => {
    res.render('about', {
        title: 'About Us | Rebirth of a Queen',
        activePage: 'about'
    });
});

// Programs Route
router.get('/ourPrograms', (req, res) => {
    res.render('programs', {
        title: 'Our Programs | Rebirth of a Queen',
        activePage: 'programs'
    });
});

router.get('/privacy-policy', (req, res) => {
    res.render('legal/privacy', {
        title: 'Privacy Policy | Rebirth of a Queen',
        activePage: 'privacy'
    });
});

router.get('/terms-of-service', (req, res) => {
    res.render('legal/terms', {
        title: 'Terms of Service | Rebirth of a Queen',
        activePage: 'terms'
    });
});

// --- Authentication Routes ---
router.get('/register', (req, res) => {
    res.render('auth/register', { title: 'Register', activePage: 'register' });
});

router.get('/login', (req, res) => {
    res.render('auth/login', { title: 'Login', activePage: 'login' });
});

router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', { title: 'Forgot Password', activePage: 'login' });
});

// Reset password expects a token in the URL query
router.get('/reset-password', (req, res) => {
    const token = req.query.token;
    res.render('auth/reset-password', { 
        title: 'Reset Password', 
        activePage: 'login',
        token: token 
    });
});

module.exports = router;