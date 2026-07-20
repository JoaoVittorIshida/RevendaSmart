const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;

const validatePassword = (value) => {
    const password = String(value ?? '');
    if (password.length < MIN_PASSWORD_LENGTH || Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
        return `A senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres e no máximo ${MAX_PASSWORD_BYTES} bytes.`;
    }
    return null;
};

module.exports = { validatePassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_BYTES };
