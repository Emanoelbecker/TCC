const Produto = require('../models/Produto');
const { internalError, notFound } = require('../utils/httpResponses');

const fields = [
    'nome', 'dataLote', 'dataValidade', 'dataFabricacao', 'observacao',
    'foto', 'valor', 'valorUnidade', 'ingredientes',
];

const labels = {
    nome: 'Nome', dataLote: 'Data do lote', dataValidade: 'Data de validade',
    dataFabricacao: 'Data de fabricação', observacao: 'Observação', foto: 'Foto',
    valor: 'Valor', valorUnidade: 'Valor por unidade', ingredientes: 'Ingredientes',
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
        if (item.path === 'foto' && item.validatorKey === 'isUrl') {
            return 'Foto deve ser uma URL válida (http ou https).';
        }
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
        try {
            const created = await Produto.create(produto);
            req.session.successMessage = 'Produto cadastrado com sucesso.';
            res.redirect(`/produtos/${created.idProduto}`);
        } catch (error) {
            if (error.name === 'SequelizeValidationError') {
                return res.status(422).render('produtos/create', { produto, errors: validationMessages(error) });
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
        try {
            const existingProduct = await findProduct(req, res);
            if (!existingProduct) return;

            const produto = productData(req.body);
            produto.idProduto = existingProduct.idProduto;
            try {
                await existingProduct.update(produto);
                req.session.successMessage = 'Produto atualizado com sucesso.';
                res.redirect(`/produtos/${existingProduct.idProduto}`);
            } catch (error) {
                if (error.name === 'SequelizeValidationError') {
                    return res.status(422).render('produtos/edit', { produto, errors: validationMessages(error) });
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