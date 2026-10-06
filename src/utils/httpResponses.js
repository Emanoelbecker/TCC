function renderStatus(res, statusCode, title, message) {
    return res.status(statusCode).render('errors/status', {
        statusCode,
        title,
        message,
    });
}

function notFound(res, message = 'O registro solicitado não foi encontrado.') {
    return renderStatus(res, 404, 'Registro não encontrado', message);
}

function internalError(res, message = 'Ocorreu um erro interno. Tente novamente.') {
    return renderStatus(res, 500, 'Erro interno', message);
}

module.exports = { renderStatus, notFound, internalError };