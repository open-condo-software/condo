const TOKEN_TYPES = {
    CONFIRM_PHONE: 'CONFIRM_PHONE',

    // CONFIRM_EMAIL: 'CONFIRM_EMAIL',
    // SUDO: 'SUDO',
}

const ABBREVIATIONS_OF_TOKEN_TYPES = {
    'cp': TOKEN_TYPES.CONFIRM_PHONE,

    // 'ce': TOKEN_TYPES.CONFIRM_EMAIL,
    // 's': TOKEN_TYPES.SUDO,
}

const SEPARATOR = ':'

function detectTokenType (token) {
    if (!token || typeof token !== 'string') throw new Error('Invalid token!')

    const parts = token.split(SEPARATOR)
    if (parts.length !== 2) throw new Error('Invalid token format!')

    const abbreviationTokenType = parts[0]

    if (!(abbreviationTokenType in ABBREVIATIONS_OF_TOKEN_TYPES)) {
        throw new Error('Unsupported token format!')
    }

    return ABBREVIATIONS_OF_TOKEN_TYPES[abbreviationTokenType]
}

function detectTokenTypeSafely (token) {
    let tokenType, error
    try {
        tokenType = detectTokenType(token)
    } catch (err) {
        error = err
    }
    return { tokenType, error }
}

module.exports = {
    TOKEN_TYPES,
    detectTokenType,
    detectTokenTypeSafely,
}
