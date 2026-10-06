const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

const seedTestUser = () => {
    const username = process.env.SEED_TEST_USERNAME;
    const password = process.env.SEED_TEST_PASSWORD;

    if (process.env.NODE_ENV === 'production') {
        throw new Error('O usuário de teste não pode ser criado em produção.');
    }
    if (!username || username.length > 50 || !password || Buffer.byteLength(password, 'utf8') > 72) {
        throw new Error('Configure SEED_TEST_USERNAME e SEED_TEST_PASSWORD válidos.');
    }

    User.findByUsername(username, (err, user) => {
        if (err) {
            console.error('Seed test user error:', err);
            return;
        }

        if (user) {
            console.log('Usuário de teste já existe.');
            return;
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = {
            username,
            password: hashedPassword,
            role: 'user',
        };

        User.create(newUser, (err) => {
            if (err) {
                console.error('Erro ao criar usuário de teste:', err);
                return;
            }
            console.log('Usuário de teste criado com senha protegida.');
        });
    });
};

module.exports = seedTestUser;
