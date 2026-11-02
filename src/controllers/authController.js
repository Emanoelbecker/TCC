const argon2 = require('argon2');
const { Administrador } = require('../models');

const authController = {
    renderLoginForm: (req, res) => {
        res.render('login', { error: null });
    },

    login: async (req, res, next) => {
        const { nomeUsuario, senha } = req.body;

        if (typeof nomeUsuario !== 'string' || typeof senha !== 'string' || !nomeUsuario.trim() || !senha || nomeUsuario.length > 50 || senha.length > 1024) {
            return res.status(400).render('login', { error: 'Preencha usuário e senha.' });
        }

        try {
            const administrador = await Administrador.findOne({ where: { nomeUsuario: nomeUsuario.trim() } });

            if (!administrador || !(await argon2.verify(administrador.senhaHash, senha))) {
                return res.status(401).render('login', { error: 'Usuário ou senha inválidos.' });
            }

            req.session.regenerate((regenerateError) => {
                if (regenerateError) {
                    return next(regenerateError);
                }

                req.session.user = {
                    id: administrador.idAdministrador,
                    username: administrador.nomeUsuario,
                    role: 'admin',
                };
                req.session.successMessage = 'Login feito com sucesso.';

                req.session.save((saveError) => {
                    if (saveError) {
                        return next(saveError);
                    }
                    return res.redirect('/dashboard');
                });
            });
        } catch (error) {
            return next(error);
        }
    },

    logout: (req, res, next) => {
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }
            res.clearCookie('connect.sid', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            });
            res.redirect('/login');
        });
    },
};

module.exports = authController;
