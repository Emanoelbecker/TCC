const MAX_MONEY_CENTS = 9999999999n;

function validateMoney(value) {
    if (value === null || value === undefined) return;
    const amount = String(value);
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
        throw new Error('Valor deve ser não negativo e ter no máximo duas casas decimais.');
    }

    const [whole, fraction = ''] = amount.split('.');
    const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
    if (cents > MAX_MONEY_CENTS) {
        throw new Error('Valor deve ser não negativo e ter no máximo duas casas decimais.');
    }
}

module.exports = { validateMoney };