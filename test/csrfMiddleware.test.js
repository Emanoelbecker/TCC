const assert = require('node:assert/strict');
const test = require('node:test');
const csrfProtection = require('../src/middlewares/csrfMiddleware');

function runMiddleware(method, token, sessionToken = 'a'.repeat(64)) {
    const req = {
        method,
        session: { csrfToken: sessionToken },
        body: token ? { _csrf: token } : {},
        get: () => undefined,
    };
    const res = { locals: {} };
    let error;
    let continued = false;

    csrfProtection(req, res, (receivedError) => {
        error = receivedError;
        continued = !receivedError;
    });

    return { error, continued, res };
}

test('CSRF permite métodos seguros e disponibiliza token para views', () => {
    const result = runMiddleware('GET');
    assert.equal(result.continued, true);
    assert.equal(result.res.locals.csrfToken, 'a'.repeat(64));
});

test('CSRF exige token válido em requisições que alteram estado', () => {
    assert.equal(runMiddleware('POST', 'a'.repeat(64)).continued, true);
    assert.equal(runMiddleware('POST', 'invalid').error.status, 403);
    assert.equal(runMiddleware('DELETE').error.status, 403);
});