var express = require('express');
const homeController = require('../controllers/homeController');
const authMiddleware = require('../middlewares/authMiddleware');
var router = express.Router();

router.get('/', authMiddleware.ensureAuthenticated, homeController.renderHome);

module.exports = router;
