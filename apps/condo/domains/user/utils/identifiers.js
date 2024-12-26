const { IPv4_REGEX, UUID_REGEXP } = require('@condo/domains/common/constants/regexps')
const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { PHONE_TYPE, IPv4_TYPE, UUID_TYPE, EMAIL_TYPE } = require('@condo/domains/user/constants/identifiers')


function getIdentifierType (identifier) {
    if (normalizePhone(identifier)) {
        return PHONE_TYPE
    } else if (IPv4_REGEX.test(identifier)) {
        return IPv4_TYPE
    } else if (UUID_REGEXP.test(identifier)) {
        return UUID_TYPE
    } else if (normalizeEmail(identifier)) {
        return EMAIL_TYPE
    }

    return null
}

module.exports = {
    getIdentifierType,
}
