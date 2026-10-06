const Categoria = require('../models/categoriaModel');
const { internalError, notFound } = require('../utils/httpResponses');

function validId(id) {
    return /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
}

const categoriaController = {
    createCategoria: (req, res) => {
        const newCategoria = {
            nome: req.body.nome
        };

        Categoria.create(newCategoria, (err, categoriaId) => {
            if (err) {
                return internalError(res, 'Não foi possível cadastrar a categoria.');
            }
            res.redirect('/categorias');
        });
    },

    getCategoriaById: (req, res) => {
        const categoriaId = req.params.id;
        if (!validId(categoriaId)) return notFound(res, 'Categoria não encontrada.');

        Categoria.findById(categoriaId, (err, categoria) => {
            if (err) {
                return internalError(res, 'Não foi possível carregar a categoria.');
            }
            if (!categoria) {
                return notFound(res, 'Categoria não encontrada.');
            }
            res.render('categorias/show', { categoria });
        });
    },

    getAllCategorias: (req, res) => {
        Categoria.getAll((err, categorias) => {
            if (err) {
                return internalError(res, 'Não foi possível carregar as categorias.');
            }
            res.render('categorias/index', { categorias });
        });
    },

    renderCreateForm: (req, res) => {
        res.render('categorias/create');
    },

    renderEditForm: (req, res) => {
        const categoriaId = req.params.id;
        if (!validId(categoriaId)) return notFound(res, 'Categoria não encontrada.');

        Categoria.findById(categoriaId, (err, categoria) => {
            if (err) {
                return internalError(res, 'Não foi possível carregar a categoria.');
            }
            if (!categoria) {
                return notFound(res, 'Categoria não encontrada.');
            }
            res.render('categorias/edit', { categoria });
        });
    },

    updateCategoria: (req, res) => {
        const categoriaId = req.params.id;
        if (!validId(categoriaId)) return notFound(res, 'Categoria não encontrada.');
        const updatedCategoria = {
            nome: req.body.nome
        };

        Categoria.findById(categoriaId, (findError, categoria) => {
            if (findError) return internalError(res, 'Não foi possível carregar a categoria.');
            if (!categoria) return notFound(res, 'Categoria não encontrada.');

            Categoria.update(categoriaId, updatedCategoria, (updateError) => {
                if (updateError) return internalError(res, 'Não foi possível atualizar a categoria.');
                res.redirect('/categorias');
            });
        });
    },

    deleteCategoria: (req, res) => {
        const categoriaId = req.params.id;
        if (!validId(categoriaId)) return notFound(res, 'Categoria não encontrada.');

        Categoria.delete(categoriaId, (err, result) => {
            if (err) {
                return internalError(res, 'Não foi possível excluir a categoria.');
            }
            if (result.affectedRows === 0) return notFound(res, 'Categoria não encontrada.');
            res.redirect('/categorias');
        });
    }
};

module.exports = categoriaController;
