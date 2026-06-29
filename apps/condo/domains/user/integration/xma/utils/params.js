const get = require('lodash/get')
const isNil = require('lodash/isNil')

const { isSafeUrl } = require('@condo/domains/common/utils/url.utils')
const { USER_TYPES } = require('@condo/domains/user/constants/common')

function getRedirectUrl (req) {
    // get and validate redirect url
    const redirectUrl = get(req, 'query.redirectUrl')
    if (!redirectUrl) {
        return null
    }
    const isSafe = isSafeUrl(redirectUrl)
    if (!isSafe) return null
    
    return redirectUrl
}

function getUserType (req) {
    // get and validate user type
    const userTypeQP = get(req, 'query.userType')
    if (isNil(userTypeQP) || !USER_TYPES.includes(userTypeQP)) return null
    return userTypeQP
}

function getBotId (req) {
    const { botId } = req.query || {}
    return botId || null
}

module.exports = {
    getRedirectUrl,
    getUserType,
    getBotId,
}
