const { phone } = require('phone')


const STRICT_PHONE_REGEX = /^\+[0-9\s()-]+$/

function normalizePhone (data, allowLandLine = false) {
    const trimmedData = typeof data === 'string' ? data.trim() : data
    if (!trimmedData || !STRICT_PHONE_REGEX.test(trimmedData)) return
    const result = phone(trimmedData, { validateMobilePrefix: !allowLandLine, strictDetection: true })
    if (result.isValid) return result.phoneNumber
}

module.exports = {
    normalizePhone,
}
