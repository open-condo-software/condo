const cookieSignature = require('cookie-signature')
const { get, isNil } = require('lodash')
const uidSafe = require('uid-safe').sync

const conf = require('@open-condo/config')
const { setSession } = require('@open-condo/keystone/session')

const { RESIDENT, USER_TYPES } = require('@condo/domains/user/constants/common')
const { TELEGRAM_AUTH_REDIS_STATE_PREFIX } = require('@condo/domains/user/integration/telegram/constants')

const getRedisStateKey = (uniqueKey) => {
    return `${TELEGRAM_AUTH_REDIS_STATE_PREFIX}${uniqueKey}`
}

const parseJson = (data) => {
    try {
        return JSON.parse(data)
    } catch (e) {
        return null
    }
}

const decodeIdToken = (idToken) => {
    try {
        const decoded = atob(idToken.split('.')[1])
        return JSON.parse(decoded)
    } catch (e) {
        return null
    }
}

const getUserType = (req) => {
    let userType = RESIDENT
    const userTypeFromQuery = get(req, 'query.userType')

    if (!isNil(userTypeFromQuery)) {
        userType = userTypeFromQuery
    }

    if (!USER_TYPES.includes(userType)) throw new Error('userType is incorrect')

    return userType
}

const startAuthedSession = async (userId, sessionStore) => {
    if (!userId) {
        throw new Error('userId is incorrect')    
    }
    
    const id = uidSafe(24)
    const payload = {
        sessionId: id,
        keystoneListKey: 'User',
        keystoneItemId: userId,
    }
    await setSession(sessionStore, payload)
    return cookieSignature.sign(id, conf.COOKIE_SECRET)
}

module.exports = {
    parseJson,
    decodeIdToken,
    getRedisStateKey,
    getUserType,
    startAuthedSession,
}