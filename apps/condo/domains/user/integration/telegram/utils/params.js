const { get, isNil } = require('lodash')

const { isSafeUrl } = require('@condo/domains/common/utils/url.utils')
const { USER_TYPES } = require('@condo/domains/user/constants/common')
const { ERROR_MESSAGES } = require('@condo/domains/user/integration/telegram/utils/errors')

function getRedirectUrl (req) {
    // get and validate redirect url
    const redirectUrl = get(req, 'query.redirectUrl')
    if (!redirectUrl || !isSafeUrl(redirectUrl)) throw new Error(ERROR_MESSAGES.INVALID_REDIRECT_URL)
    return redirectUrl
}

function getUserType (req) {
    // get and validate user type
    const userTypeQP = get(req, 'query.userType')
    if (isNil(userTypeQP) || !USER_TYPES.includes(userTypeQP)) {
        throw new Error(ERROR_MESSAGES.NOT_SUPPORTED_USER_TYPE)
    }

    return userTypeQP
}

module.exports = {
    getRedirectUrl,
    getUserType,
}