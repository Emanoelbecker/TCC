var express = require('express');
const homeController = require('../controllers/homeController');
const authMiddleware = require('../middlewares/authMiddleware');
var router = express.Router();

router.get('/', homeController.renderLanding);
router.get('/catalogo', homeController.renderProducts);
router.get('/dashboard', authMiddleware.ensureAuthenticated, homeController.renderHome);

module.exports = router;
