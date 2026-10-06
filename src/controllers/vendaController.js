const Cliente = require('../models/Cliente');
const Produto = require('../models/Produto');
const Venda = require('../models/Venda');
const ItemVenda = require('../models/ItemVenda');
const sequelize = require('../config/sequelize');
const { Op } = require('sequelize');
const { internalError, notFound } = require('../utils/httpResponses');

const MAX_MONEY_CENTS = 9999999999n;

function validId(id) {
    return /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
}

function saleData(body) {
    const rawClientId = typeof body.idCliente === 'string' ? body.idCliente.trim() : '';
    const sale = {
        idCliente: validId(rawClientId) ? Number(rawClientId) : rawClientId || null,
    };

    ['localEntrega', 'dataPedido', 'dataEntrega', 'observacao'].forEach((field) => {
        const value = typeof body[field] === 'string' ? body[field].trim() : '';
        sale[field] = value === '' ? null : value;
    });

    return sale;
}

function formItems(body) {
    const submittedProductIds = body.idProduto ?? body['idProduto[]'];
    const submittedQuantities = body.quantidade ?? body['quantidade[]'];
    const productIds = Array.isArray(submittedProductIds) ? submittedProductIds : [submittedProductIds || ''];
    const quantities = Array.isArray(submittedQuantities) ? submittedQuantities : [submittedQuantities || ''];

    if (productIds.length !== quantities.length) return null;
    return productIds.map((idProduto, index) => ({
        idProduto: typeof idProduto === 'string' ? idProduto.trim() : '',
        quantidade: typeof quantities[index] === 'string' ? quantities[index].trim() : '',
    }));
}

function moneyToCents(value) {
    const amount = String(value ?? '');
    if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) return null;
    const [whole, fraction = ''] = amount.split('.');
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}

function centsToMoney(cents) {
    return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
}

function validationMessages(error) {
    const labels = {
        idCliente: 'Cliente',
        localEntrega: 'Local de entrega',
        dataPedido: 'Data do pedido',
        dataEntrega: 'Data de entrega',
        valorTotal: 'Valor total',
        observacao: 'Observação',
    };

    if (error.name !== 'SequelizeValidationError') {
        return ['Não foi possível cadastrar a venda. Verifique os dados informados.'];
    }

    return error.errors.map((item) => {
        const label = labels[item.path] || item.path;
        if (item.validatorKey === 'validateMoney') {
            return `${label} deve ser não negativo e ter no máximo duas casas decimais.`;
        }
        if (item.validatorKey === 'notNull' || item.validatorKey === 'notEmpty') return `${label} é obrigatório.`;
        if (item.validatorKey === 'isDate') return `${label} deve ser uma data válida.`;
        if (item.validatorKey === 'len') return `${label} excede o tamanho permitido.`;
        return `Verifique o campo ${label}.`;
    });
}

async function renderForm(res, venda, errors, status = 200) {
    try {
        const [clientes, produtos] = await Promise.all([
            Cliente.findAll({ order: [['nome', 'ASC'], ['idCliente', 'ASC']] }),
            Produto.findAll({
                attributes: ['idProduto', 'nome', 'valorUnidade'],
                order: [['nome', 'ASC'], ['idProduto', 'ASC']],
            }),
        ]);
        return res.status(status).render('vendas/create', { venda, clientes, produtos, errors });
    } catch (error) {
        return internalError(res, 'Não foi possível carregar os clientes.');
    }
}

function saleIncludes() {
    return [
        { model: Cliente, as: 'cliente' },
        { model: ItemVenda, as: 'itensVenda', include: [{ model: Produto, as: 'produto' }] },
    ];
}

async function findSale(req, res) {
    if (!validId(req.params.id)) {
        notFound(res, 'Venda não encontrada.');
        return null;
    }
    const venda = await Venda.findByPk(req.params.id, { include: saleIncludes() });
    if (!venda) notFound(res, 'Venda não encontrada.');
    return venda;
}

function saleItemsFromForm(itens, produtosPorId) {
    let totalCents = 0n;
    const itensVenda = [];
    for (const item of itens) {
        const produto = produtosPorId.get(Number(item.idProduto));
        const valorUnitarioCents = moneyToCents(produto.valorUnidade);
        if (valorUnitarioCents === null) {
            return { error: `O produto ${produto.nome} não possui um valor por unidade válido.` };
        }
        totalCents += valorUnitarioCents * BigInt(item.quantidade);
        if (totalCents > MAX_MONEY_CENTS) return { error: 'O valor total da venda excede o limite permitido.' };
        itensVenda.push({
            idProduto: Number(item.idProduto),
            quantidade: Number(item.quantidade),
            valorUnitario: centsToMoney(valorUnitarioCents),
        });
    }
    return { total: centsToMoney(totalCents), itensVenda };
}

const vendaController = {
    async index(req, res) {
        try {
            const vendas = await Venda.findAll({
                include: saleIncludes(),
                order: [['dataPedido', 'DESC'], ['idVenda', 'DESC']],
            });
            return res.render('vendas/index', { vendas });
        } catch (error) {
            return internalError(res, 'Não foi possível carregar as vendas.');
        }
    },

    async renderCreateForm(req, res) {
        const venda = {
            dataPedido: new Date().toISOString().slice(0, 10),
            itens: [{ idProduto: '', quantidade: '1' }],
        };
        await renderForm(res, venda, []);
    },

    async createVenda(req, res) {
        const venda = saleData(req.body);
        const itens = formItems(req.body);
        venda.itens = itens || [];
        if (!validId(venda.idCliente)) {
            return renderForm(res, venda, ['Selecione um cliente válido.'], 422);
        }
        if (!itens || itens.length === 0 || itens.some((item) => !item.idProduto || !item.quantidade)) {
            return renderForm(res, venda, ['Adicione pelo menos um produto e informe sua quantidade.'], 422);
        }
        if (itens.some((item) => !validId(item.idProduto))) {
            return renderForm(res, venda, ['Selecione produtos válidos.'], 422);
        }
        if (itens.some((item) => !/^\d+$/.test(item.quantidade) || Number(item.quantidade) < 1 || Number(item.quantidade) > 2147483647)) {
            return renderForm(res, venda, ['A quantidade de cada produto deve ser um número inteiro maior que zero.'], 422);
        }

        try {
            const cliente = await Cliente.findByPk(venda.idCliente);
            if (!cliente) {
                return renderForm(res, venda, ['O cliente selecionado não existe.'], 422);
            }

            const productIds = [...new Set(itens.map((item) => Number(item.idProduto)))];
            const produtos = await Produto.findAll({ where: { idProduto: { [Op.in]: productIds } } });
            const produtosPorId = new Map(produtos.map((produto) => [Number(produto.idProduto), produto]));
            if (productIds.some((idProduto) => !produtosPorId.has(idProduto))) {
                return renderForm(res, venda, ['Um ou mais produtos selecionados não existem.'], 422);
            }

            let totalCents = 0n;
            const itensVenda = [];
            for (const item of itens) {
                const produto = produtosPorId.get(Number(item.idProduto));
                const valorUnitarioCents = moneyToCents(produto.valorUnidade);
                if (valorUnitarioCents === null) {
                    return renderForm(res, venda, [`O produto ${produto.nome} não possui um valor por unidade válido.`], 422);
                }

                const subtotalCents = valorUnitarioCents * BigInt(item.quantidade);
                totalCents += subtotalCents;
                if (totalCents > MAX_MONEY_CENTS) {
                    return renderForm(res, venda, ['O valor total da venda excede o limite permitido.'], 422);
                }
                itensVenda.push({
                    idProduto: Number(item.idProduto),
                    quantidade: Number(item.quantidade),
                    valorUnitario: centsToMoney(valorUnitarioCents),
                });
            }

            await sequelize.transaction(async (transaction) => {
                const vendaCriada = await Venda.create({
                    ...saleData(req.body),
                    valorTotal: centsToMoney(totalCents),
                }, { transaction });
                await ItemVenda.bulkCreate(itensVenda.map((item) => ({
                    ...item,
                    idVenda: vendaCriada.idVenda,
                })), { transaction });
            });
            req.session.successMessage = 'Venda cadastrada com sucesso.';
            return res.redirect('/vendas/new');
        } catch (error) {
            if (error.name === 'SequelizeValidationError') {
                return renderForm(res, venda, validationMessages(error), 422);
            }
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                return renderForm(res, venda, ['O cliente selecionado não existe.'], 422);
            }
            return internalError(res, 'Não foi possível cadastrar a venda.');
        }
    },

    async show(req, res) {
        try {
            const venda = await findSale(req, res);
            if (venda) {
                venda.itensVenda.forEach((item) => {
                    const unitCents = moneyToCents(item.valorUnitario);
                    item.subtotal = unitCents === null
                        ? '0.00'
                        : centsToMoney(unitCents * BigInt(item.quantidade));
                });
                return res.render('vendas/show', { venda });
            }
        } catch (error) {
            return internalError(res, 'Não foi possível carregar a venda.');
        }
    },

    async editForm(req, res) {
        try {
            const venda = await findSale(req, res);
            if (!venda) return;
            venda.itens = venda.itensVenda.map((item) => ({
                idProduto: item.idProduto,
                quantidade: String(item.quantidade),
            }));
            return renderForm(res, venda, []);
        } catch (error) {
            return internalError(res, 'Não foi possível carregar a venda.');
        }
    },

    async update(req, res) {
        const vendaData = saleData(req.body);
        const itens = formItems(req.body);
        vendaData.idVenda = req.params.id;
        vendaData.itens = itens || [];
        if (!validId(req.params.id)) return notFound(res, 'Venda não encontrada.');
        if (!validId(vendaData.idCliente)) {
            return renderForm(res, vendaData, ['Selecione um cliente válido.'], 422);
        }
        if (!itens || itens.length === 0 || itens.some((item) => !item.idProduto || !item.quantidade)) {
            return renderForm(res, vendaData, ['Adicione pelo menos um produto e informe sua quantidade.'], 422);
        }
        if (itens.some((item) => !validId(item.idProduto))) {
            return renderForm(res, vendaData, ['Selecione produtos válidos.'], 422);
        }
        if (itens.some((item) => !/^\d+$/.test(item.quantidade) || Number(item.quantidade) < 1 || Number(item.quantidade) > 2147483647)) {
            return renderForm(res, vendaData, ['A quantidade de cada produto deve ser um número inteiro maior que zero.'], 422);
        }

        try {
            const venda = await Venda.findByPk(req.params.id);
            if (!venda) return notFound(res, 'Venda não encontrada.');
            if (!await Cliente.findByPk(vendaData.idCliente)) {
                return renderForm(res, vendaData, ['O cliente selecionado não existe.'], 422);
            }
            const productIds = [...new Set(itens.map((item) => Number(item.idProduto)))];
            const produtos = await Produto.findAll({ where: { idProduto: { [Op.in]: productIds } } });
            const produtosPorId = new Map(produtos.map((produto) => [Number(produto.idProduto), produto]));
            if (productIds.some((idProduto) => !produtosPorId.has(idProduto))) {
                return renderForm(res, vendaData, ['Um ou mais produtos selecionados não existem.'], 422);
            }
            const calculated = saleItemsFromForm(itens, produtosPorId);
            if (calculated.error) return renderForm(res, vendaData, [calculated.error], 422);

            await sequelize.transaction(async (transaction) => {
                await ItemVenda.destroy({ where: { idVenda: venda.idVenda }, transaction });
                await venda.update({ ...saleData(req.body), valorTotal: calculated.total }, { transaction });
                await ItemVenda.bulkCreate(calculated.itensVenda.map((item) => ({
                    ...item,
                    idVenda: venda.idVenda,
                })), { transaction });
            });
            req.session.successMessage = 'Venda atualizada com sucesso.';
            return res.redirect(`/vendas/${venda.idVenda}`);
        } catch (error) {
            if (error.name === 'SequelizeValidationError') {
                vendaData.idVenda = req.params.id;
                return renderForm(res, vendaData, validationMessages(error), 422);
            }
            return internalError(res, 'Não foi possível atualizar a venda.');
        }
    },

    async delete(req, res) {
        try {
            const venda = await findSale(req, res);
            if (!venda) return;
            await sequelize.transaction(async (transaction) => {
                await ItemVenda.destroy({ where: { idVenda: venda.idVenda }, transaction });
                await venda.destroy({ transaction });
            });
            req.session.successMessage = 'Venda excluída com sucesso.';
            return res.redirect('/vendas');
        } catch (error) {
            return internalError(res, 'Não foi possível excluir a venda.');
        }
    },
};

module.exports = vendaController;