const express = require('express');
const clienteController = require('../controllers/clienteController');

const router = express.Router();

router.get('/', clienteController.index);
router.get('/new', clienteController.newForm);
router.post('/', clienteController.create);
router.get('/:id/edit', clienteController.editForm);
router.put('/:id', clienteController.update);
router.delete('/:id', clienteController.delete);
router.get('/:id', clienteController.show);

module.exports = router;