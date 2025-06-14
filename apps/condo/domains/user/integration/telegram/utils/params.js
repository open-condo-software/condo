const { get, isNil } = require('lodash')

const { isSafeUrl } = require('@condo/domains/common/utils/url.utils')
const { USER_TYPES } = require('@condo/domains/user/constants/common')

function getRedirectUrl (req) {
    // get and validate redirect url
    const redirectUrl = get(req, 'query.redirectUrl')
    if (!redirectUrl || !isSafeUrl(redirectUrl)) return ''
    return redirectUrl
}

function getUserType (req) {
    // get and validate user type
    const userTypeQP = get(req, 'query.userType')
    if (isNil(userTypeQP) || !USER_TYPES.includes(userTypeQP)) return ''
    return userTypeQP
}

/** @param botToken {string} {botId}:{someSecret} */
function parseBotId (botToken) {
    if (!botToken || typeof botToken !== 'string') {
        throw new Error('Invalid bot token: token must be a non-empty string')
    }
    const parts = botToken.split(':')
    if (parts.length < 2 || !parts[0]) {
        throw new Error('Invalid bot token format: expected format is "{botId}:{secret}"')
    }
    return parts[0]
}

module.exports = {
    getRedirectUrl,
    getUserType,
    parseBotId,
}