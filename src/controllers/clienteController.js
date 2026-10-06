const Cliente = require('../models/Cliente');
const { internalError, notFound } = require('../utils/httpResponses');

const fields = [
    'nome', 'cpf', 'cnpj', 'representante', 'email', 'telefone', 'nomeFantasia',
    'observacao', 'rua', 'numero', 'cep', 'uf', 'bairro',
];

function clientData(body) {
    const data = {};
    fields.forEach((field) => {
        const value = typeof body[field] === 'string' ? body[field].trim() : '';
        data[field] = value === '' ? null : value;
    });

    if (data.numero !== null && /^\d+$/.test(data.numero)) {
        data.numero = Number(data.numero);
    }
    return data;
}

function validationMessages(error) {
    const labels = {
        nome: 'Nome', cpf: 'CPF', cnpj: 'CNPJ', representante: 'Representante',
        email: 'E-mail', telefone: 'Telefone', nomeFantasia: 'Nome fantasia',
        observacao: 'Observação', rua: 'Rua', numero: 'Número', cep: 'CEP',
        uf: 'UF', bairro: 'Bairro',
    };

    if (error.name === 'SequelizeUniqueConstraintError') {
        return (error.errors || []).map((item) => `${labels[item.path] || item.path} já cadastrado.`);
    }

    if (error.name !== 'SequelizeValidationError') {
        return ['Não foi possível salvar o cliente. Verifique se CPF ou CNPJ já estão cadastrados.'];
    }

    return error.errors.map((item) => {
        const label = labels[item.path] || item.path;
        if (item.validatorKey === 'cpfOrCnpj') return 'Informe o CPF ou CNPJ do cliente.';
        if (item.validatorKey === 'isEmail') return 'Informe um e-mail válido.';
        if (item.path === 'cpf' && item.validatorKey === 'is') return 'CPF deve conter 11 números.';
        if (item.path === 'cnpj' && item.validatorKey === 'is') return 'CNPJ deve conter 14 números.';
        if (item.path === 'cep' && item.validatorKey === 'is') return 'CEP deve conter 8 números.';
        if (item.path === 'uf' && item.validatorKey === 'is') return 'UF deve conter 2 letras.';
        if (item.path === 'numero' && item.validatorKey === 'min') return 'Número deve ser um inteiro igual ou maior que zero.';
        if (item.validatorKey === 'notNull' || item.validatorKey === 'notEmpty') return `${label} é obrigatório.`;
        if (item.validatorKey === 'len') return `${label} excede o tamanho permitido.`;
        return `Verifique o campo ${label}.`;
    });
}

function validId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

async function findClient(req, res) {
    if (!validId(req.params.id)) {
        notFound(res, 'Cliente não encontrado.');
        return null;
    }
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) notFound(res, 'Cliente não encontrado.');
    return cliente;
}

const clienteController = {
    async index(req, res) {
        try {
            const clientes = await Cliente.findAll({
                order: [['nome', 'ASC'], ['idCliente', 'ASC']],
            });
            res.render('clientes/index', { clientes });
        } catch (error) {
            internalError(res, 'Não foi possível carregar os clientes.');
        }
    },

    newForm(req, res) {
        res.render('clientes/create', { cliente: {}, errors: [] });
    },

    async create(req, res) {
        const cliente = clientData(req.body);
        if (cliente.numero !== null && typeof cliente.numero !== 'number') {
            return res.status(422).render('clientes/create', {
                cliente, errors: ['Número deve ser um inteiro igual ou maior que zero.'],
            });
        }

        try {
            await Cliente.create(cliente);
            req.session.successMessage = 'Cliente cadastrado com sucesso.';
            res.redirect('/clientes');
        } catch (error) {
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                return res.status(422).render('clientes/create', { cliente, errors: validationMessages(error) });
            }
            internalError(res, 'Não foi possível cadastrar o cliente.');
        }
    },

    async show(req, res) {
        try {
            const cliente = await findClient(req, res);
            if (cliente) res.render('clientes/show', { cliente });
        } catch (error) {
            internalError(res, 'Não foi possível carregar o cliente.');
        }
    },

    async editForm(req, res) {
        try {
            const cliente = await findClient(req, res);
            if (cliente) res.render('clientes/edit', { cliente, errors: [] });
        } catch (error) {
            internalError(res, 'Não foi possível carregar o cliente.');
        }
    },

    async update(req, res) {
        try {
            const existingClient = await findClient(req, res);
            if (!existingClient) return;

            const cliente = clientData(req.body);
            cliente.idCliente = existingClient.idCliente;
            if (cliente.numero !== null && typeof cliente.numero !== 'number') {
                return res.status(422).render('clientes/edit', {
                    cliente, errors: ['Número deve ser um inteiro igual ou maior que zero.'],
                });
            }

            try {
                await existingClient.update(cliente);
                req.session.successMessage = 'Cliente atualizado com sucesso.';
                res.redirect(`/clientes/${existingClient.idCliente}`);
            } catch (error) {
                if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                    return res.status(422).render('clientes/edit', { cliente, errors: validationMessages(error) });
                }
                internalError(res, 'Não foi possível atualizar o cliente.');
            }
        } catch (error) {
            internalError(res, 'Não foi possível carregar o cliente.');
        }
    },

    async delete(req, res) {
        try {
            const cliente = await findClient(req, res);
            if (!cliente) return;

            try {
                await cliente.destroy();
                req.session.successMessage = 'Cliente excluído com sucesso.';
                res.redirect('/clientes');
            } catch (error) {
                if (error.name === 'SequelizeForeignKeyConstraintError') {
                    req.session.errorMessage = 'Este cliente possui vendas vinculadas e não pode ser excluído.';
                    return res.redirect('/clientes');
                }
                internalError(res, 'Não foi possível excluir o cliente.');
            }
        } catch (error) {
            internalError(res, 'Não foi possível carregar o cliente.');
        }
    },
};

module.exports = clienteController;