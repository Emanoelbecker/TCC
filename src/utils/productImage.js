const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const uploadDirectory = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'produtos');
const allowedFormats = new Set(['jpeg', 'png', 'webp']);
const extensions = { jpeg: 'jpg', png: 'png', webp: 'webp' };

async function validateProductImage(file) {
    if (!file || !Buffer.isBuffer(file.buffer)) return null;
    if (file.size > 5 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 5 MB.');

    let metadata;
    try {
        metadata = await sharp(file.buffer, { failOn: 'error' }).metadata();
    } catch (error) {
        throw new Error('O arquivo enviado não é uma imagem válida.');
    }

    if (!allowedFormats.has(metadata.format)) {
        throw new Error('Selecione uma imagem JPG, JPEG, PNG ou WEBP válida.');
    }
    return extensions[metadata.format];
}

async function saveProductImage(file, extension) {
    await fs.mkdir(uploadDirectory, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}.${extension}`;
    await fs.writeFile(path.join(uploadDirectory, filename), file.buffer, { flag: 'wx' });
    return filename;
}

async function removeProductImage(filename) {
    if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) return;
    try {
        await fs.unlink(path.join(uploadDirectory, filename));
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
}

module.exports = { validateProductImage, saveProductImage, removeProductImage };
