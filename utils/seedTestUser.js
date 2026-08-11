const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

const seedTestUser = () => {
    User.findByUsername('USERTESTE', (err, user) => {
        if (err) {
            console.error('Seed test user error:', err);
            return;
        }

        if (user) {
            console.log('Usuário de teste já existe: USERTESTE');
            return;
        }

        const hashedPassword = bcrypt.hashSync('TESTE01', 10);
        const newUser = {
            username: 'USERTESTE',
            password: hashedPassword,
            role: 'user',
        };

        User.create(newUser, (err) => {
            if (err) {
                console.error('Erro ao criar usuário de teste:', err);
                return;
            }
            console.log('Usuário de teste criado: USERTESTE / TESTE01');
        });
    });
};

module.exports = seedTestUser;
