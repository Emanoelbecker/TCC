const authMiddleware = {
    ensureAuthenticated: (req, res, next) => {
        if (req.session && req.session.user && req.session.user.role === 'admin') {
            return next();
        }
        if (req.session && req.session.user) {
            const error = new Error('Forbidden');
            error.status = 403;
            return next(error);
        }
        return res.redirect('/login');
    },

    redirectIfAuthenticated: (req, res, next) => {
        if (req.session && req.session.user && req.session.user.role === 'admin') {
            return res.redirect('/');
        }
        return next();
    },
};

module.exports = authMiddleware;
