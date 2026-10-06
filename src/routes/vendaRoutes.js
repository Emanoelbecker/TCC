const express = require('express');
const vendaController = require('../controllers/vendaController');

const router = express.Router();

router.get('/', vendaController.index);
router.get('/new', vendaController.renderCreateForm);
router.post('/', vendaController.createVenda);
router.get('/:id/edit', vendaController.editForm);
router.put('/:id', vendaController.update);
router.delete('/:id', vendaController.delete);
router.get('/:id', vendaController.show);

module.exports = router;