const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');
const { isAdmin } = require('../middleware/authMiddleware');
const { sendInquiryEmail } = require('../services/emailService');

/* Home Route */
router.get('/', async (req, res) => {
    try {
        const [latestPosts] = await sequelize.query(
            "SELECT id, title, slug, content, created_at FROM blog_posts ORDER BY created_at DESC LIMIT 3"
        );

        res.render('index', {
            title: 'Rebirth of a Queen',
            latestPosts: latestPosts || []
        });
    } catch (e) {
        console.error('Failed to load latest blog posts:', e);
        res.render('index', { title: 'Home', latestPosts: [] });
    }
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

// --- Blog (Public) ---
router.get('/blog', async (req, res) => {
    const [posts] = await sequelize.query("SELECT * FROM blog_posts ORDER BY created_at DESC");
    res.render('blog', {
        title: 'Blog | Rebirth of a Queen',
        activePage: 'blog',
        posts: posts || []
    });
});

router.get('/blog/:slug', async (req, res) => {
    const { slug } = req.params;
    const [rows] = await sequelize.query("SELECT * FROM blog_posts WHERE slug = ? LIMIT 1", { replacements: [slug] });

    if (!rows || rows.length === 0) {
        return res.status(404).render('404', { title: '404 - Not Found', activePage: null });
    }

    res.render('blog-post', {
        title: rows[0].title + ' | Rebirth of a Queen',
        activePage: 'blog',
        post: rows[0]
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

// Admin Dashboard Route - Only accessible by admins
router.get('/admin-dashboard', isAdmin, (req, res) => {
    res.render('admin/dashboard', { 
        title: 'Admin Dashboard | Rebirth of a Queen',
        activePage: 'dashboard'
    });
});

router.get('/about', (req, res) => {
    res.render('about', { 
        title: 'About Us | Rebirth of a Queen',
        activePage: 'about' 
    });
});

router.get('/shop', (req, res) => {
    res.render('shop', { 
        title: 'Shop | Rebirth of a Queen',
        activePage: 'shop' 
    });
});

router.get('/get-involved', (req, res) => {
    res.render('get-involved', { 
        title: 'Get Involved | Rebirth of a Queen',
        activePage: 'get-involved' 
    });
});

    router.post('/inquiry/contact', async (req, res) => {
        try {
            const { name, email, interest, message } = req.body;

            // 1. Save to Database
            // We use COALESCE or default values if interest/message is missing
            await sequelize.query(
                'INSERT INTO inquiries (name, email, interest, message) VALUES (?, ?, ?, ?)',
                { 
                    replacements: [
                        name, 
                        email, 
                        interest || 'General Contact', 
                        message || 'No message provided'
                    ], 
                    type: sequelize.QueryTypes.INSERT 
                }
            );

            // 2. Send Email (Simulation or Production)
            await sendInquiryEmail({ 
                name, 
                email, 
                interest: interest || 'General Contact',
                message 
            });

            res.redirect('/?status=success');
        } catch (error) {
            console.error("Submission Error:", error);
            res.status(500).send("Error submitting form.");
        }
    });
router.get('/contact', (req, res) => {
    res.render('contact', { 
        title: 'Contact Us | Rebirth of a Queen',
        activePage: 'contact' 
    });
});

router.get('/social-enterprises', (req, res) => {
    res.render('social-enterprises', { 
        title: 'Social Enterprises | Rebirth of a Queen',
        activePage: 'social-enterprises'
    });
});

module.exports = router;
