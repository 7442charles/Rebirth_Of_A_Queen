require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const { sequelize } = require('./config/db');
const authRoutes = require('./routes/auth');

// Import your page routes
const pageRoutes = require('./routes/pages');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.json()); 

// Use the routes
app.use('/', pageRoutes);
app.use('/', authRoutes);


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
    console.log(`📂 Database Name: ${process.env.NODE_ENV === 'production' ? process.env.LIVE_DB_NAME : process.env.LOCAL_DB_NAME}`);
    
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err);
  });