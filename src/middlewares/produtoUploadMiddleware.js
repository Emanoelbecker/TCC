const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

function produtoUpload(req, res, next) {
    if (!req.is('multipart/form-data')) return next();
    if (!/^\/produtos(?:\/[^/]+)?(?:\/edit)?\/?$/.test(req.path)) return next();

    return upload.single('foto')(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            const uploadError = new Error('A imagem deve ter no máximo 5 MB.');
            uploadError.status = 422;
            return next(uploadError);
        }
        error.status = error.status || 400;
        return next(error);
    });
}

module.exports = produtoUpload;
