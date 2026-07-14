const isAdmin = (req, res, next) => {
    // Check if session exists and role is admin
    if (req.session && req.session.role === 'admin') {
        return next();
    }
    // Deny access if not admin
    res.status(403).send("Access Denied: You do not have administrator privileges.");
};

module.exports = { isAdmin };