const { renderStatus } = require('../utils/httpResponses');

function notFoundHandler(req, res, next) {
    const error = new Error('Route not found');
    error.status = 404;
    next(error);
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);

    const requestedStatus = Number(error.statusCode || error.status);
    const statusCode = requestedStatus >= 400 && requestedStatus < 600 ? requestedStatus : 500;
    const responses = {
        400: ['Requisição inválida', 'Não foi possível interpretar os dados enviados.'],
        403: ['Acesso negado', 'Você não tem permissão para acessar este recurso.'],
        404: ['Página não encontrada', 'A página solicitada não existe.'],
        413: ['Requisição muito grande', 'Os dados enviados excedem o limite permitido.'],
    };
    const [title, message] = responses[statusCode] || [
        'Erro interno',
        'Ocorreu um erro inesperado. Tente novamente mais tarde.',
    ];

    if (statusCode >= 500) console.error('Application error:', error);

    res.locals.user = req.session?.user || null;
    res.locals.successMessage = null;
    res.locals.errorMessage = null;
    if (req.accepts('html')) return renderStatus(res, statusCode, title, message);
    return res.status(statusCode).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };