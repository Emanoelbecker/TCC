const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

const authController = {
    renderLoginForm: (req, res) => {
        res.render('login', { error: null });
    },

    login: (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.render('login', { error: 'Preencha usuário e senha.' });
        }

        User.findByUsername(username, (err, user) => {
            if (err) {
                return res.status(500).render('login', { error: 'Erro interno ao autenticar.' });
            }

            if (!user) {
                return res.render('login', { error: 'Usuário ou senha inválidos.' });
            }

            if (!bcrypt.compareSync(password, user.password)) {
                return res.render('login', { error: 'Usuário ou senha inválidos.' });
            }

            req.session.user = {
                id: user.id,
                username: user.username,
                role: user.role,
            };
            req.session.successMessage = 'login feito com sucesso';

            return res.redirect('/');
        });
    },

    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.redirect('/');
            }
            res.clearCookie('connect.sid');
            res.redirect('/login');
        });
    },
};

module.exports = authController;
