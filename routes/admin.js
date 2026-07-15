const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');
const { isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');


router.use((req, res, next) => {
    res.locals.images = []; // Default to empty
    next();
});

// Main Dashboard
router.get('/admin/dashboard', isAdmin, (req, res) => {
    res.render('admin/dashboard');
});

// Programs
router.get('/admin/programs', isAdmin, (req, res) => {
    res.render('admin/programs', { activePage: 'programs' });
});

// Blog
router.get('/admin/blog', isAdmin, (req, res) => {
    res.render('admin/blog');
});

// Gallery
router.get('/admin/gallery', isAdmin, (req, res) => {
    res.render('admin/gallery');
});

// Get Settings Page
router.get('/admin/settings', isAdmin, async (req, res) => {
    const [settings] = await sequelize.query("SELECT value FROM settings WHERE `key` = 'donation_link'");
    res.render('admin/settings', { 
        title: 'Admin Settings', // <--- ADD THIS
        activePage: 'settings', 
        donationLink: settings[0]?.value || '' 
    });
});

// View Gallery
router.get('/admin/gallery', isAdmin, async (req, res) => {
    try {
        // Query the database
        const [images] = await sequelize.query("SELECT * FROM gallery ORDER BY uploaded_at DESC");
        
        // Pass data directly to render
        res.render('admin/gallery', { 
            title: 'Gallery Manager', 
            activePage: 'gallery', 
            images: images // This will now correctly populate the page
        });
    } catch (error) {
        console.error(error);
        res.render('admin/gallery', { title: 'Gallery Manager', activePage: 'gallery', images: [] });
    }
});

// Upload Image
router.post('/admin/gallery/upload', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const imagePath = '/uploads/' + req.file.filename;
        const altText = req.body.alt_text || 'Gallery Image';
        
        await sequelize.query(
            "INSERT INTO gallery (image_path, alt_text) VALUES (?, ?)",
            { replacements: [imagePath, altText] }
        );
        
        res.redirect('/admin/gallery');
    } catch (error) {
        console.error(error);
        res.status(500).send("Upload failed.");
    }
});

// Update Donation Link
router.post('/admin/settings/update-donation', isAdmin, async (req, res) => {
    const { donationUrl } = req.body;
    try {
        await sequelize.query(
            "UPDATE settings SET value = ? WHERE `key` = 'donation_link'",
            { replacements: [donationUrl] }
        );
        res.status(200).json({ message: "Donation link updated successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update settings." });
    }
});



module.exports = router;