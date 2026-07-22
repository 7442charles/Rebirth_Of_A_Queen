const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');
const { isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const slugify = (str) =>
  String(str || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

router.use((req, res, next) => {
  res.locals.images = [];
  next();
});

// Main Dashboard
// In routes/admin.js
router.get('/admin/dashboard', isAdmin, async (req, res) => {
    try {
        const [counts] = await Promise.all([
            sequelize.query(`
                SELECT 
                    (SELECT COUNT(*) FROM blog_posts) as totalBlogs,
                    (SELECT COUNT(*) FROM inquiries WHERE status = 'unmarked') as pendingInquiries,
                    (SELECT COUNT(*) FROM gallery) as totalGalleryItems
            `)
        ]);
        
        const data = counts[0][0];

        res.render('admin/dashboard', { 
            title: 'Admin Dashboard', 
            activePage: 'dashboard',
            ...data // Passes totalBlogs, pendingInquiries, totalGalleryItems
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).send("Error loading dashboard");
    }
});


// Programs (admin view)
router.get('/admin/programs', isAdmin, async (req, res) => {
  const [programs] = await sequelize.query("SELECT * FROM programs ORDER BY created_at DESC");
  res.render('admin/programs', {
    title: 'Programs Manager',
    activePage: 'programs',
    programs: programs || []
  });
});

// Programs create/update (simple, optional)
router.post('/admin/programs/save', isAdmin, async (req, res) => {
  const { id, title, body_text } = req.body;
  const safeTitle = (title || '').trim();
  if (!safeTitle) return res.status(400).json({ message: 'Title is required' });

  try {
    if (id) {
      await sequelize.query(
        "UPDATE programs SET title = ?, body_text = ? WHERE id = ?",
        { replacements: [safeTitle, body_text || null, id] }
      );
    } else {
      await sequelize.query(
        "INSERT INTO programs (title, body_text) VALUES (?, ?)",
        { replacements: [safeTitle, body_text || null] }
      );
    }
    res.json({ message: 'Programs saved' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to save programs' });
  }
});

// View Blog Manager Page
router.get('/admin/blog', isAdmin, async (req, res) => {
    try {
        const [posts] = await sequelize.query("SELECT * FROM blog_posts ORDER BY created_at DESC");
        res.render('admin/blog', {
            title: 'Blog Manager',
            activePage: 'blog',
            blogs: posts || [],
            csrfToken: req.csrfToken ? req.csrfToken() : '' // Optional if using CSRF
        });
    } catch (error) {
        console.error("Error loading blog manager:", error);
        res.status(500).send("Error loading blog manager");
    }
});

// Create New Blog Post
router.post('/admin/blog', isAdmin, upload.any(), async (req, res) => {
    try {
        const { title, excerpt, content } = req.body;
        const file = req.files ? req.files.find(f => f.fieldname === 'coverImage') : null;
        const coverImage = file ? '/uploads/' + file.filename : null;
        const slug = slugify(title);
        const authorId = req.session?.userId || null;

        await sequelize.query(
            "INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, author_id) VALUES (?, ?, ?, ?, ?, ?)",
            { replacements: [title, slug, excerpt || null, content || null, coverImage, authorId] }
        );

        res.redirect('/admin/blog');
    } catch (error) {
        console.error("Error creating blog:", error);
        res.status(500).send("Failed to create blog post.");
    }
});

// Edit Existing Blog Post
router.post('/admin/blogs/edit/:id', isAdmin, upload.any(), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, excerpt, content } = req.body;
        const file = req.files ? req.files.find(f => f.fieldname === 'coverImage') : null;
        const slug = title ? slugify(title) : undefined;

        // Check if a new file was uploaded to handle image updates conditionally
        if (file) {
            const coverImage = '/uploads/' + file.filename;
            await sequelize.query(
                "UPDATE blog_posts SET title = ?, slug = ?, excerpt = ?, content = ?, cover_image = ? WHERE id = ?",
                { replacements: [title, slug, excerpt, content, coverImage, id] }
            );
        } else {
            await sequelize.query(
                "UPDATE blog_posts SET title = ?, slug = ?, excerpt = ?, content = ? WHERE id = ?",
                { replacements: [title, slug, excerpt, content, id] }
            );
        }

        res.redirect('/admin/blog');
    } catch (error) {
        console.error("Error updating blog:", error);
        res.status(500).send("Failed to update blog post.");
    }
});

// Fetch Single Blog Data (For AJAX Editing Injection)
router.get('/admin/blog/json/:id', isAdmin, async (req, res) => {
    try {
        const [rows] = await sequelize.query("SELECT * FROM blog_posts WHERE id = ?", { replacements: [req.params.id] });
        if (!rows || rows.length === 0) return res.status(404).json({ message: 'Blog not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Blog Post
router.post('/admin/blog/:id/delete', isAdmin, async (req, res) => {
    try {
        await sequelize.query("DELETE FROM blog_posts WHERE id = ?", { replacements: [req.params.id] });
        res.redirect('/admin/blog');
    } catch (error) {
        console.error("Error deleting blog:", error);
        res.status(500).send("Failed to delete blog post.");
    }
});

// Gallery (admin view)
router.get('/admin/gallery', isAdmin, async (req, res) => {
  try {
    const [images] = await sequelize.query("SELECT * FROM gallery ORDER BY uploaded_at DESC");
    res.render('admin/gallery', {
      title: 'Gallery Manager',
      activePage: 'gallery',
      images: images || []
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

// Get Settings Page
router.get('/admin/settings', isAdmin, async (req, res) => {
  const [settings] = await sequelize.query("SELECT value FROM settings WHERE `key` = 'donation_link'");
  res.render('admin/settings', {
    title: 'Admin Settings',
    activePage: 'settings',
    donationLink: settings[0]?.value || ''
  });
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

// View all inquiries
router.get('/admin/inquiries', async (req, res) => {
    const [inquiries] = await sequelize.query("SELECT * FROM inquiries ORDER BY created_at DESC");
    
    res.render('admin/inquiries', { 
        inquiries, 
        activePage: 'inquiries' // This activates the link in the sidebar
    });
});

// Mark as answered
router.post('/admin/inquiries/mark-answered/:id', async (req, res) => {
    await sequelize.query(
        "UPDATE inquiries SET status = 'Answered' WHERE id = ?",
        { replacements: [req.params.id] }
    );
    res.redirect('/admin/inquiries');
});

module.exports = router;
