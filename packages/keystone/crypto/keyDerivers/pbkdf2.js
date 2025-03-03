const crypto = require('crypto')

const isNil = require('lodash/isNil')

const SALT_LENGTH = 16
const ITERATIONS_COUNT = 15_000

function derive (secretKey, { keyLen, salt = null, iterations = null }) {
    if (isNil(salt)) {
        salt = crypto.randomBytes(SALT_LENGTH)
    }
    if (isNil(iterations)) {
        iterations = ITERATIONS_COUNT
    }

    const masterKey = crypto.pbkdf2Sync(secretKey, salt, iterations, keyLen, 'sha512')

    return {
        masterKey,
        salt,
        iterations,
    }
}

module.exports = {
    saltLength: SALT_LENGTH,
    derive,
}