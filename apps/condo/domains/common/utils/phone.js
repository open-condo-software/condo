const { phone } = require('phone')

function normalizePhone(data, allowLandLine = false) {
    if (!data || !data.startsWith('+')) return
    const result = phone(data, { validateMobilePrefix: !allowLandLine, strictDetection: true })
    if (result.isValid) return result.phoneNumber
}

module.exports = {
    normalizePhone,
}
