const crypto = require('crypto')

const cookieSignature = require('cookie-signature')
const { get, isNil } = require('lodash')
const uidSafe = require('uid-safe').sync
const { v4: uuid } = require('uuid')

const conf = require('@open-condo/config')
const { setSession } = require('@open-condo/keystone/session')

const { RESIDENT, USER_TYPES } = require('@condo/domains/user/constants/common')
const { 
    TELEGRAM_AUTH_REDIS_START_PREFIX,
    TELEGRAM_AUTH_REDIS_TOKEN_PREFIX,
    TELEGRAM_AUTH_REDIS_STATUS_PREFIX,
    TELEGRAM_AUTH_REDIS_BOT_STATE_PREFIX,
} = require('@condo/domains/user/integration/telegram/constants')

const TELEGRAM_AUTH_BOT_URL = process.env.TELEGRAM_AUTH_BOT_URL

function getRedisStartKey (startKey){
    return `${TELEGRAM_AUTH_REDIS_START_PREFIX}${startKey}`
}

function getRedisTokenKey (uniqueKey){
    return `${TELEGRAM_AUTH_REDIS_TOKEN_PREFIX}${uniqueKey}`
}

function getRedisBotStateKey (chatId){
    return `${TELEGRAM_AUTH_REDIS_BOT_STATE_PREFIX}${chatId}`
}

function getRedisStatusKey (uniqueKey){
    return `${TELEGRAM_AUTH_REDIS_STATUS_PREFIX}${uniqueKey}`
}

function generateStartLinkAndKey () {
    if (!TELEGRAM_AUTH_BOT_URL) throw new Error('TELEGRAM_AUTH_BOT_URL is not configured')
    const startKey = uuid()
    const startLink = `${TELEGRAM_AUTH_BOT_URL}?start=${startKey}`

    return { startKey, startLink }
}

function generateUniqueKey () {
    return crypto.randomBytes(32).toString('hex')
}

function getUserType (req) {
    let userType = RESIDENT
    const userTypeFromQuery = get(req, 'query.userType')

    if (!isNil(userTypeFromQuery)) {
        userType = userTypeFromQuery
    }

    if (!USER_TYPES.includes(userType)) throw new Error('userType is incorrect')

    return userType
}

async function startAuthedSession (userId, sessionStore) {
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
    getRedisStartKey,
    getRedisTokenKey,
    getRedisBotStateKey,
    getRedisStatusKey,
    generateStartLinkAndKey,
    generateUniqueKey,
    getUserType,
    startAuthedSession,
}