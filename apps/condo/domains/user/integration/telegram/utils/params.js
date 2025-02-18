const crypto = require('crypto')

const cookieSignature = require('cookie-signature')
const { get, isNil } = require('lodash')
const uidSafe = require('uid-safe').sync

const conf = require('@open-condo/config')
const { setSession } = require('@open-condo/keystone/session')

const { RESIDENT, USER_TYPES } = require('@condo/domains/user/constants/common')
const { TELEGRAM_AUTH_REDIS_STATE_PREFIX, TELEGRAM_AUTH_CONFIG_REQUIRED_FIELDS } = require('@condo/domains/user/integration/telegram/constants')

const signUniqueKey = (uniqueKey, secretKey) => {
    if (!uniqueKey || !secretKey) throw new Error('signUniqueKey wrong params')

    const signature = crypto.createHmac('sha256', secretKey)
        .update(uniqueKey)
        .digest('hex')

    return `${uniqueKey}:${signature}`
}

const verifyUniqueKey = (signedUniqueKey, secretKey) => {
    if (!secretKey) throw new Error('verifyUniqueKey wrong params')

    const [uniqueKey, signature] = signedUniqueKey.split(':')
    if (!uniqueKey || !signature) return false

    const expectedSignature = crypto.createHmac('sha256', secretKey)
        .update(uniqueKey)
        .digest('hex')

    return signature === expectedSignature ? uniqueKey : null
}

const getAuthLink = (config, checks) => {
    const link = new URL(config.authUrl)
    link.searchParams.set('state', checks.state)
    link.searchParams.set('clientId', config.clientId)
    link.searchParams.set('redirectUri', config.callbackUrl)
    link.searchParams.set('nonce', checks.nonce)

    return link.toString()
}

const validateTelegramAuthConfig = (config) => {
    const missingFields = TELEGRAM_AUTH_CONFIG_REQUIRED_FIELDS.filter(field => !(field in config))

    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }
}

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
    const decoded = atob(idToken.split('.')[1])
    return parseJson(decoded)
}

const getUserType = (req) => {
    //Resident by default as in others auth integrations
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
    validateTelegramAuthConfig,
    getAuthLink,
    signUniqueKey,
    verifyUniqueKey,
}