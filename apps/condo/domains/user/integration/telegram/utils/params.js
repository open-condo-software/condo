const crypto = require('crypto')

const { get, isNil } = require('lodash')

const { RESIDENT, USER_TYPES } = require('@condo/domains/user/constants/common')
const { TELEGRAM_AUTH_REDIS_STATE_PREFIX, TELEGRAM_AUTH_CONFIG_REQUIRED_FIELDS } = require('@condo/domains/user/integration/telegram/constants')

function signUniqueKey (uniqueKey, secretKey){
    if (!uniqueKey || !secretKey) throw new Error('signUniqueKey wrong params')

    const signature = crypto.createHmac('sha256', secretKey)
        .update(uniqueKey)
        .digest('hex')

    return `${uniqueKey}:${signature}`
}

function verifyUniqueKey (signedUniqueKey, secretKey) {
    if (!secretKey) throw new Error('verifyUniqueKey wrong params')

    const [uniqueKey, signature] = signedUniqueKey.split(':')
    if (!uniqueKey || !signature) return false

    const expectedSignature = crypto.createHmac('sha256', secretKey)
        .update(uniqueKey)
        .digest('hex')

    return signature === expectedSignature ? uniqueKey : null
}

function getAuthLink  (config, checks)  {
    const link = new URL(config.authUrl)
    link.searchParams.set('state', checks.state)
    link.searchParams.set('clientId', config.clientId)
    link.searchParams.set('redirectUri', config.callbackUrl)
    link.searchParams.set('nonce', checks.nonce)

    return link.toString()
}

function validateTelegramAuthConfig (config) {
    const missingFields = TELEGRAM_AUTH_CONFIG_REQUIRED_FIELDS.filter(field => !(field in config))

    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }
}

function getRedisSessionKey (uniqueKey) {
    return `${TELEGRAM_AUTH_REDIS_STATE_PREFIX}${uniqueKey}`
}

function parseJson (data) {
    try {
        return JSON.parse(data)
    } catch (e) {
        return null
    }
}

function decodeIdToken (idToken) {
    const decoded = Buffer.from(idToken.split('.')[1], 'base64')
    return parseJson(decoded)
}

function getUserType (req) {
    //Resident by default as in others auth integrations
    let userType = RESIDENT
    const userTypeFromQuery = get(req, 'query.userType')

    if (!isNil(userTypeFromQuery)) {
        userType = userTypeFromQuery
    }

    if (!USER_TYPES.includes(userType)) throw new Error('userType is incorrect')

    return userType
}

module.exports = {
    parseJson,
    decodeIdToken,
    getRedisSessionKey,
    getUserType,
    validateTelegramAuthConfig,
    getAuthLink,
    signUniqueKey,
    verifyUniqueKey,
}