const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/login', authMiddleware.redirectIfAuthenticated, authController.renderLoginForm);
router.post('/login', authMiddleware.redirectIfAuthenticated, authController.login);
router.post('/logout', authMiddleware.ensureAuthenticated, authController.logout);

module.exports = router;
