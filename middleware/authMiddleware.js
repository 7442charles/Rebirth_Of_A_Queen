const isAdmin = (req, res, next) => {
    // Check if session exists and role is admin
    if (req.session && req.session.role === 'admin') {
        return next();
    }
    
    // Deny access and render the 403 page
    res.status(403).render('403', { 
        title: 'Access Denied' 
    });
};

module.exports = { isAdmin };