const { phone } = require('phone')

function normalizePhone (input, opts = { allowLandLine: false }) {
    if (!input || typeof input !== 'string' || !input.startsWith('+')) {
        return undefined
    }
    const normalized = phone(input, { validateMobilePrefix: !opts.allowLandLine, strictDetection: true })

    return normalized.isValid ? normalized.phoneNumber : undefined
}

module.exports = {
    normalizePhone,
}