const { isObject, get, isNil } = require('lodash')

const { isSafeUrl } = require('@condo/domains/common/utils/url.utils')
const { RESIDENT, USER_TYPES, SBER_ID_SESSION_KEY } = require('@condo/domains/user/constants/common')

function getRedirectUrl (req) {
    // get and validate redirect url
    const redirectUrl = get(req, 'query.redirectUrl') || getSessionParam(req, 'redirectUrl')
    if (redirectUrl && !isSafeUrl(redirectUrl)) throw new Error('redirectUrl is incorrect')
    return redirectUrl
}

function getUserType (req) {
    // get and validate user type
    let userType = RESIDENT
    const userTypeQP = get(req, 'query.userType')
    const userTypeSessionParam = getSessionParam(req, 'userType')
    if (!isNil(userTypeQP)) {
        userType = userTypeQP
    } else if (!isNil(userTypeSessionParam)) {
        userType = userTypeSessionParam
    }

    if (!USER_TYPES.includes(userType)) throw new Error('userType is incorrect')

    return userType
}

function getSessionParam (req, path) {
    if (isObject(req.session) && isObject(req.session[SBER_ID_SESSION_KEY])) {
        return get(req.session[SBER_ID_SESSION_KEY], path)
    }
}

module.exports = {
    getRedirectUrl,
    getUserType,
    getSessionParam,
}