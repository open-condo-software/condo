const crypto = require('crypto')

const isNil = require('lodash/isNil')

const SALT_LENGTH = 16
const BRUTE_FORCE_STRENGTH = 10_000

function derive (secretKey, { keyLen, salt = null, iterations = null }) {
    if (isNil(salt)) {
        salt = crypto.randomBytes(SALT_LENGTH)
    }
    if (isNil(iterations)) {
        iterations = Math.floor(Math.random() * (10000)) + BRUTE_FORCE_STRENGTH
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