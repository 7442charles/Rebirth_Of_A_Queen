require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
//// DB disabled for local running without database
//// const { sequelize } = require('./config/db');
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/test');

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
app.use('/', testRoutes);


// 404 Catch-all route
app.use((req, res, next) => {
    res.status(404).render('404', { 
        title: '404 - Page Not Found',
        activePage: null 
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
