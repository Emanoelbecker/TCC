const Produto = require('../models/Produto');
const { internalError, notFound } = require('../utils/httpResponses');
const { validateProductImage, saveProductImage, removeProductImage } = require('../utils/productImage');

const fields = [
    'nome', 'observacao', 'valor', 'ingredientes',
];

const labels = {
    nome: 'Nome', observacao: 'Observação',
    valor: 'Valor', ingredientes: 'Ingredientes',
};

function productData(body) {
    const produto = {};
    fields.forEach((field) => {
        const value = typeof body[field] === 'string' ? body[field].trim() : '';
        produto[field] = value === '' ? null : value;
    });
    return produto;
}

function validId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

function validationMessages(error) {
    if (error.name !== 'SequelizeValidationError') {
        return ['Não foi possível salvar o produto. Verifique os dados informados.'];
    }

    return error.errors.map((item) => {
        const label = labels[item.path] || item.path;
        if (item.validatorKey === 'validateMoney') {
            return `${label} deve ser não negativo e ter no máximo duas casas decimais.`;
        }
        if (item.validatorKey === 'isDate') return `${label} deve ser uma data válida.`;
        if (item.validatorKey === 'min') return `${label} deve ser igual ou maior que zero.`;
        if (item.validatorKey === 'notNull' || item.validatorKey === 'notEmpty') return `${label} é obrigatório.`;
        if (item.validatorKey === 'len') return `${label} excede o tamanho permitido.`;
        return `Verifique o campo ${label}.`;
    });
}

async function storeUploadedImage(file) {
    if (!file) return null;
    const extension = await validateProductImage(file);
    return saveProductImage(file, extension);
}

async function findProduct(req, res) {
    if (!validId(req.params.id)) {
        notFound(res, 'Produto não encontrado.');
        return null;
    }
    const produto = await Produto.findByPk(req.params.id);
    if (!produto) notFound(res, 'Produto não encontrado.');
    return produto;
}

const produtoController = {
    async getAllProdutos(req, res) {
        try {
            const produtos = await Produto.findAll({ order: [['nome', 'ASC'], ['idProduto', 'ASC']] });
            res.render('produtos/index', { produtos });
        } catch (error) {
            internalError(res, 'Não foi possível carregar os produtos.');
        }
    },

    renderCreateForm(req, res) {
        res.render('produtos/create', { produto: {}, errors: [] });
    },

    async createProduto(req, res) {
        const produto = productData(req.body);
        let savedFilename = null;
        try {
            savedFilename = await storeUploadedImage(req.file);
            if (savedFilename) produto.foto = savedFilename;
            const created = await Produto.create(produto);
            req.session.successMessage = 'Produto cadastrado com sucesso.';
            res.redirect(`/produtos/${created.idProduto}`);
        } catch (error) {
            if (savedFilename) await removeProductImage(savedFilename);
            if (error.name === 'SequelizeValidationError') {
                return res.status(422).render('produtos/create', { produto, errors: validationMessages(error) });
            }
            if (typeof error.message === 'string' && error.message.includes('imagem')) {
                return res.status(422).render('produtos/create', { produto, errors: [error.message] });
            }
            internalError(res, 'Não foi possível cadastrar o produto.');
        }
    },

    async getProdutoById(req, res) {
        try {
            const produto = await findProduct(req, res);
            if (produto) res.render('produtos/show', { produto });
        } catch (error) {
            internalError(res, 'Não foi possível carregar o produto.');
        }
    },

    async renderEditForm(req, res) {
        try {
            const produto = await findProduct(req, res);
            if (produto) res.render('produtos/edit', { produto, errors: [] });
        } catch (error) {
            internalError(res, 'Não foi possível carregar o produto.');
        }
    },

    async updateProduto(req, res) {
        let savedFilename = null;
        let previousFilename = null;
        try {
            const existingProduct = await findProduct(req, res);
            if (!existingProduct) return;

            previousFilename = existingProduct.foto;
            const produto = productData(req.body);
            produto.idProduto = existingProduct.idProduto;
            try {
                savedFilename = await storeUploadedImage(req.file);
                if (savedFilename) produto.foto = savedFilename;
                else if (req.body.removerFoto === '1') produto.foto = null;
                await existingProduct.update(produto);
                if (savedFilename || req.body.removerFoto === '1') await removeProductImage(previousFilename);
                req.session.successMessage = 'Produto atualizado com sucesso.';
                res.redirect(`/produtos/${existingProduct.idProduto}`);
            } catch (error) {
                if (savedFilename) await removeProductImage(savedFilename);
                if (error.name === 'SequelizeValidationError') {
                    return res.status(422).render('produtos/edit', { produto, errors: validationMessages(error) });
                }
                if (typeof error.message === 'string' && error.message.includes('imagem')) {
                    return res.status(422).render('produtos/edit', { produto, errors: [error.message] });
                }
                internalError(res, 'Não foi possível atualizar o produto.');
            }
        } catch (error) {
            internalError(res, 'Não foi possível carregar o produto.');
        }
    },

    async deleteProduto(req, res) {
        try {
            const produto = await findProduct(req, res);
            if (!produto) return;

            try {
                await produto.destroy();
                await removeProductImage(produto.foto);
                req.session.successMessage = 'Produto excluído com sucesso.';
                res.redirect('/produtos');
            } catch (error) {
                if (error.name === 'SequelizeForeignKeyConstraintError') {
                    req.session.errorMessage = 'Este produto possui vendas vinculadas e não pode ser excluído.';
                    return res.redirect('/produtos');
                }
                internalError(res, 'Não foi possível excluir o produto.');
            }
        } catch (error) {
            internalError(res, 'Não foi possível carregar o produto.');
        }
    },
};

module.exports = produtoController;