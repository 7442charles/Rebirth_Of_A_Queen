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
router.get('/admin/dashboard', isAdmin, (req, res) => {
  res.render('admin/dashboard', { title: 'Admin Dashboard', activePage: 'dashboard' });
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

// Blog (admin manager view)
router.get('/admin/blog', isAdmin, async (req, res) => {
  const [posts] = await sequelize.query(
    "SELECT * FROM blog_posts ORDER BY created_at DESC"
  );
  res.render('admin/blog', {
    title: 'Blog Manager',
    activePage: 'blog',
    posts: posts || []
  });
});

// Blog create/update via existing dashboard form action (/admin/save)
router.post('/admin/save', isAdmin, async (req, res) => {
  // dashboard currently posts: title, content
  // blog_posts columns: title, slug, content, author_id
  const { title, content, id } = req.body;
  const safeTitle = (title || '').trim();
  if (!safeTitle) return res.status(400).json({ message: 'Title is required' });

  const generatedSlug = slugify(safeTitle);
  try {
    if (id) {
      // Update existing
      await sequelize.query(
        "UPDATE blog_posts SET title = ?, slug = ?, content = ? WHERE id = ?",
        { replacements: [safeTitle, generatedSlug, content || null, id] }
      );
    } else {
      // Create new
      const authorId = req.session?.userId || null;
      await sequelize.query(
        "INSERT INTO blog_posts (title, slug, content, author_id) VALUES (?, ?, ?, ?)",
        { replacements: [safeTitle, generatedSlug, content || null, authorId] }
      );
    }
    res.redirect('/admin/blog');
  } catch (e) {
    console.error(e);
    res.status(500).send('Failed to save blog post.');
  }
});

// Blog edit fetch (AJAX)
router.get('/admin/blog/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  const [rows] = await sequelize.query("SELECT * FROM blog_posts WHERE id = ?", { replacements: [id] });
  if (!rows || rows.length === 0) return res.status(404).json({ message: 'Not found' });
  res.json(rows[0]);
});

/**
 * Blog image upload (for Summernote media insertion)
 * Expects multipart form-data field name: `image`
 * Returns: { url: '/uploads/<filename>' }
 */
router.post('/admin/blog/upload-image', isAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const imageUrl = '/uploads/' + req.file.filename;
    res.json({ url: imageUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Image upload failed' });
  }
});

// Blog delete
router.post('/admin/blog/:id/delete', isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await sequelize.query("DELETE FROM blog_posts WHERE id = ?", { replacements: [id] });
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Delete failed' });
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
