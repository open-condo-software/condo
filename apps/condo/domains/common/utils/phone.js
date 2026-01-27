const { phone } = require('phone')


const STRICT_PHONE_REGEX = /^\+[0-9\s()-]+$/

function normalizePhone (data, allowLandLine = false) {
    const trimmedData = typeof data === 'string' ? data.trim() : data
    if (!trimmedData || !STRICT_PHONE_REGEX.test(trimmedData)) return
    const result = phone(trimmedData, { validateMobilePrefix: !allowLandLine, strictDetection: true })
    if (result.isValid) return result.phoneNumber
}

/**
 * The function masks the normalized phone number
 * @param {string} normalizedPhone
 * @return {string}
 */
function maskNormalizedPhone (normalizedPhone) {
    const hasPlus = normalizedPhone.startsWith('+')
    const digits = normalizedPhone.replace(/\D/g, '')

    const addPlus = hasPlus ? '+' : ''

    if (digits.length <= 1) {
        return addPlus + digits
    }

    if (digits.length === 2) {
        return addPlus + digits[0] + '*'
    }

    if (digits.length > 2 && digits.length < 7) {
        const first = digits.slice(0, 1)
        const last = digits.slice(-1)
        const middle = '*'.repeat(Math.max(1, digits.length - 2))

        return addPlus + first + middle + last
    }

    const first = digits.slice(0, 2)
    const last = digits.slice(-2)
    const middle = '*'.repeat(Math.max(1, digits.length - 4))

    return addPlus + first + middle + last
}


module.exports = {
    normalizePhone,
    maskNormalizedPhone,
}
