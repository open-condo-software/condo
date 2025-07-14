const { v4: uuid } = require('uuid')


const TOKEN_TYPES = {
    CONFIRM_PHONE: 'CONFIRM_PHONE',
    CONFIRM_EMAIL: 'CONFIRM_EMAIL',
    SUDO: 'SUDO',
}

const TOKEN_TYPE_BY_ABBREVIATION = {
    'cp': TOKEN_TYPES.CONFIRM_PHONE,
    'ce': TOKEN_TYPES.CONFIRM_EMAIL,
    's': TOKEN_TYPES.SUDO,
}

const ABBREVIATION_BY_TOKEN_TYPE = {
    'CONFIRM_PHONE': 'cp',
    'CONFIRM_EMAIL': 'ce',
    'SUDO': 's',
}

const TOKEN_SEPARATOR = ':'


/**
 * @param token {string}
 * @return {string}
 */
function detectTokenType (token) {
    if (!token || typeof token !== 'string') throw new Error('Invalid token!')

    const parts = token.split(TOKEN_SEPARATOR)
    if (parts.length !== 2) throw new Error('Invalid token format!')

    const abbreviationTokenType = parts[0]

    if (!(abbreviationTokenType in TOKEN_TYPE_BY_ABBREVIATION)) {
        throw new Error('Unsupported token format!')
    }

    return TOKEN_TYPE_BY_ABBREVIATION[abbreviationTokenType]
}

/**
 * @param token {string}
 * @return {{tokenType: string, error}}
 */
function detectTokenTypeSafely (token) {
    let tokenType, error
    try {
        tokenType = detectTokenType(token)
    } catch (err) {
        error = err
    }
    return { tokenType, error }
}

/**
 * @param tokenType {'CONFIRM_PHONE' | 'SUDO'}
 * @return {string}
 */
function generateToken (tokenType) {
    if (!tokenType || typeof tokenType !== 'string') {
        throw new Error('Invalid token type!')
    }

    if (!(tokenType in TOKEN_TYPES) || !(tokenType in ABBREVIATION_BY_TOKEN_TYPE)) {
        throw new Error('Unsupported token type!')
    }

    return [ABBREVIATION_BY_TOKEN_TYPE[tokenType], uuid()].join(TOKEN_SEPARATOR)
}

/**
 * Generates a random fake token for time-based attack prevention logic
 * @return {string}
 */
function generateSimulatedToken () {
    return ['simulated', uuid()].join(TOKEN_SEPARATOR)
}

/**
 * @param tokenType {string}
 * @return {{error, token: string}}
 */
function generateTokenSafely (tokenType) {
    let token, error
    try {
        token = generateToken(tokenType)
    } catch (err) {
        error = err
    }
    return { token, error }
}


module.exports = {
    TOKEN_TYPES,
    ABBREVIATION_BY_TOKEN_TYPE,
    detectTokenType,
    detectTokenTypeSafely,
    generateToken,
    generateTokenSafely,
    generateSimulatedToken,
}
