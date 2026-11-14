const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { internalError, notFound } = require('../utils/httpResponses');

function validId(id) {
    return /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
}

function validateUserInput(body, requirePassword, role = body.role) {
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || username.length > 50 || !['admin', 'user'].includes(role)) return null;
    if (requirePassword && (Buffer.byteLength(password, 'utf8') < 8 || Buffer.byteLength(password, 'utf8') > 72)) return null;
    if (password && (Buffer.byteLength(password, 'utf8') < 8 || Buffer.byteLength(password, 'utf8') > 72)) return null;

    return { username, role, password };
}

const userController = {
    createUser: (req, res) => {
        const input = validateUserInput(req.body, true, 'admin');
        if (!input) return res.status(400).send('Dados de usuário inválidos.');

        const hashedPassword = bcrypt.hashSync(input.password, 10);
        const newUser = {
            username: input.username,
            password: hashedPassword,
            role: input.role,
        };

        User.create(newUser, (err, userId) => {
            if (err) {
                return internalError(res, 'Não foi possível cadastrar o usuário.');
            }
            res.redirect('/users');
        });
    },

    getUserById: (req, res) => {
        const userId = req.params.id;
        if (!validId(userId)) return notFound(res, 'Usuário não encontrado.');

        User.findById(userId, (err, user) => {
            if (err) {
                return internalError(res, 'Não foi possível carregar o usuário.');
            }
            if (!user) {
                return notFound(res, 'Usuário não encontrado.');
            }
            res.render('users/show', { user });
        });
    },

    getAllUsers: (req, res) => {
        User.getAll((err, users) => {
            if (err) {
                return internalError(res, 'Não foi possível carregar os usuários.');
            }
            res.render('users/index', { users });
        });
    },

    renderCreateForm: (req, res) => {
        res.render('users/create');
    },

    renderEditForm: (req, res) => {
        const userId = req.params.id;
        if (!validId(userId)) return notFound(res, 'Usuário não encontrado.');

        User.findById(userId, (err, user) => {
            if (err) {
                return internalError(res, 'Não foi possível carregar o usuário.');
            }
            if (!user) {
                return notFound(res, 'Usuário não encontrado.');
            }
            res.render('users/edit', { user });
        });
    },

    updateUser: (req, res) => {
        const userId = req.params.id;
        if (!validId(userId)) return notFound(res, 'Usuário não encontrado.');
        const input = validateUserInput(req.body, false);
        if (!input) return res.status(400).send('Dados de usuário inválidos.');

        User.findById(userId, (err, user) => {
            if (err) {
                return internalError(res, 'Não foi possível carregar o usuário.');
            }
            if (!user) {
                return notFound(res, 'Usuário não encontrado.');
            }

            const updatedUser = {
                username: input.username,
                role: input.role,
            };

            if (input.password) {
                updatedUser.password = bcrypt.hashSync(input.password, 10);
            }

            User.update(userId, updatedUser, (err) => {
                if (err) {
                    return internalError(res, 'Não foi possível atualizar o usuário.');
                }
                res.redirect('/users');
            });
        });
    },

    deleteUser: (req, res) => {
        const userId = req.params.id;
        if (!validId(userId)) return notFound(res, 'Usuário não encontrado.');

        User.delete(userId, (err, result) => {
            if (err) {
                return internalError(res, 'Não foi possível excluir o usuário.');
            }
            if (result.affectedRows === 0) return notFound(res, 'Usuário não encontrado.');
            res.redirect('/users');
        });
    },

    searchUsers: (req, res) => {
        const search = req.query.search || '';

        User.searchByName(search, (err, users) => {
            if (err) {
                return res.status(500).json({ error: 'Não foi possível buscar usuários.' });
            }
            res.json({ users });
        });
    },
};

module.exports = userController;
