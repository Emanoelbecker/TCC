const authMiddleware = {
    ensureAuthenticated: (req, res, next) => {
        if (req.session && req.session.user) {
            return next();
        }
        return res.redirect('/login');
    },

    redirectIfAuthenticated: (req, res, next) => {
        if (req.session && req.session.user) {
            return res.redirect('/');
        }
        return next();
    },
};

module.exports = authMiddleware;
