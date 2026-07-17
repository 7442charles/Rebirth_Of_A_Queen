require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const { sequelize } = require('./config/db');

const app = express();

// Middleware & View Engine
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session Middleware
app.use(session({
    secret: 'your-very-secure-random-string',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

// GLOBAL MIDDLEWARE (Must be placed BEFORE routes)
// 1. Donation Link Middleware
app.use(async (req, res, next) => {
    try {
        const [results] = await sequelize.query("SELECT value FROM settings WHERE `key` = 'donation_link'");
        res.locals.donationLink = (results && results.length > 0) ? results[0].value : '#';
    } catch (e) {
        res.locals.donationLink = '#';
        console.error("Error loading donation link:", e);
    }
    next();
});

// 2. Global Title Middleware (Fixes your "title is not defined" error)
app.use((req, res, next) => {
    res.locals.title = 'Rebirth of a Queen'; // Default title
    next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/test');
const adminRoutes = require('./routes/admin');
const pageRoutes = require('./routes/pages');

// Use the routes (Now routes have access to session and locals)
app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/', testRoutes);
app.use('/', adminRoutes);

// 404 Catch-all route
app.use((req, res, next) => {
    res.status(404).render('404', { 
        title: '404 - Page Not Found',
        activePage: null 
    });
});

const PORT = process.env.PORT || 3000;

// Database Connection Check
sequelize.authenticate()
  .then(() => {
    console.log(`✅ Database connected: ${process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'LOCAL'}`);
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err);
  });