require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { sequelize } = require('./config/db');

const app = express();

// Middleware & View Engine
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session Store Configuration
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    clearExpired: true,
    checkExpirationInterval: 900000 // 15 minutes
});

// Session Middleware
app.use(session({
    key: 'rebirth_session_cookie',
    secret: process.env.SESSION_SECRET || 'a-very-long-and-secure-random-string',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // true if using HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// GLOBAL MIDDLEWARE
app.use(async (req, res, next) => {
    try {
        const [results] = await sequelize.query("SELECT value FROM settings WHERE `key` = 'donation_link'");
        res.locals.donationLink = (results && results.length > 0) ? results[0].value : '#';
    } catch (e) {
        res.locals.donationLink = '#';
    }
    next();
});

app.use((req, res, next) => {
    res.locals.title = 'Rebirth of a Queen';
    next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/test');
const adminRoutes = require('./routes/admin');
const pageRoutes = require('./routes/pages');

app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/', testRoutes);
app.use('/', adminRoutes);

// 404 Catch-all
app.use((req, res, next) => {
    res.status(404).render('404', { 
        title: '404 - Page Not Found',
        activePage: null 
    });
});

const PORT = process.env.PORT || 3000;

sequelize.authenticate()
  .then(() => {
    console.log(`✅ Database connected: ${process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'LOCAL'}`);
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err);
  });