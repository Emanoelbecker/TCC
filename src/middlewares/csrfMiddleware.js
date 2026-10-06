const crypto = require('crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function csrfProtection(req, res, next) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }

    res.locals.csrfToken = req.session.csrfToken;

    if (SAFE_METHODS.has(req.method)) return next();

    const submittedToken = req.get('csrf-token') || req.body?._csrf;
    const expectedToken = req.session.csrfToken;
    const submittedBuffer = Buffer.from(String(submittedToken || ''));
    const expectedBuffer = Buffer.from(expectedToken);

    if (submittedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(submittedBuffer, expectedBuffer)) {
        const error = new Error('Invalid CSRF token');
        error.status = 403;
        return next(error);
    }

    return next();
}

module.exports = csrfProtection;