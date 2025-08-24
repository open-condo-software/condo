const get = require('lodash/get')
const isNil = require('lodash/isNil')

const { isSafeUrl } = require('@condo/domains/common/utils/url.utils')
const { USER_TYPES } = require('@condo/domains/user/constants/common')

function getRedirectUrl (req) {
    // get and validate redirect url
    const redirectUrl = get(req, 'query.redirectUrl')
    if (!redirectUrl || !isSafeUrl(redirectUrl)) return null
    return decodeURIComponent(redirectUrl)
}

function getUserType (req) {
    // get and validate user type
    const userTypeQP = get(req, 'query.userType')
    if (isNil(userTypeQP) || !USER_TYPES.includes(userTypeQP)) return null
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

function getBotId (req) {
    const { botId } = req.query || {}
    return botId || null
}

module.exports = {
    getRedirectUrl,
    getUserType,
    parseBotId,
    getBotId,
}