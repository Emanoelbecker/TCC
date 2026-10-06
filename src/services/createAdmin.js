const argon2 = require('argon2');
const readline = require('readline');
const { Administrador } = require('../models');
const sequelize = require('../config/sequelize');

function ask(question) {
    const interfaceReadline = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        interfaceReadline.question(question, (answer) => {
            interfaceReadline.close();
            resolve(answer);
        });
    });
}

function askHidden(question) {
    const input = process.stdin;

    if (!input.isTTY || typeof input.setRawMode !== 'function') {
        return Promise.reject(new Error('Execute este comando em um terminal interativo.'));
    }

    readline.emitKeypressEvents(input);

    return new Promise((resolve, reject) => {
        let password = '';
        const wasPaused = input.isPaused();

        const cleanup = () => {
            input.removeListener('keypress', onKeypress);
            input.setRawMode(false);
            if (wasPaused) input.pause();
            process.stdout.write('\n');
        };

        const onKeypress = (character, key) => {
            if (key.ctrl && key.name === 'c') {
                cleanup();
                reject(new Error('Operação cancelada.'));
                return;
            }

            if (key.name === 'return') {
                cleanup();
                resolve(password);
                return;
            }

            if (key.name === 'backspace') {
                password = password.slice(0, -1);
                process.stdout.write('\b \b');
                return;
            }

            if (character && !key.ctrl && !key.meta) {
                password += character;
                process.stdout.write('*');
            }
        };

        process.stdout.write(question);
        input.setRawMode(true);
        input.resume();
        input.on('keypress', onKeypress);
    });
}

async function createAdmin() {
    try {
        const nomeUsuario = (await ask('Nome de usuário: ')).trim();
        const senha = await askHidden('Senha: ');

        const passwordLength = Buffer.byteLength(senha, 'utf8');
        if (!nomeUsuario || nomeUsuario.length > 50 || passwordLength < 12 || passwordLength > 128) {
            throw new Error('Informe um usuário (até 50 caracteres) e uma senha de 12 a 128 bytes.');
        }

        await sequelize.authenticate();

        const existingAdmin = await Administrador.findOne({ where: { nomeUsuario } });
        if (existingAdmin) {
            throw new Error('Já existe um administrador com esse nome de usuário.');
        }

        const senhaHash = await argon2.hash(senha, { type: argon2.argon2id });
        await Administrador.create({ nomeUsuario, senhaHash });

        console.log(`Administrador ${nomeUsuario} criado com senha protegida.`);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.error('Já existe um administrador com esse nome de usuário.');
        } else {
            console.error(`Não foi possível criar o administrador: ${error.message}`);
        }
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

createAdmin();