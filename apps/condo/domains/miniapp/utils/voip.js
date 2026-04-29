const { randomBytes, timingSafeEqual } = require('crypto')

const { z } = require('zod')

const { getKVClient } = require('@open-condo/keystone/kv')
const KEY_PREFIX = 'voipCallStatus'
const kv = getKVClient(KEY_PREFIX)
const CALL_STATUS_TTL_IN_SECONDS = 60 * 3 // 3 minutes

const MIN_CALL_ID_LENGTH = 1
const MAX_CALL_ID_LENGTH = 300

const MAX_CALL_META_LENGTH = 1000

const CALL_ID_NOT_ALLOWED_CHARACTERS_REGEX = /[^a-zA-Z0-9\\/.,?_^&$\-+*]/

const CALL_STATUS_STARTED = 'CALL_STATUS_STARTED'
const CALL_STATUS_ENDED = 'CALL_STATUS_ENDED'
const CALL_STATUS_ANSWERED = 'CALL_STATUS_ANSWERED'
const CALL_STATUSES = {
    [CALL_STATUS_STARTED]: CALL_STATUS_STARTED,
    [CALL_STATUS_ENDED]: CALL_STATUS_ENDED,
    [CALL_STATUS_ANSWERED]: CALL_STATUS_ANSWERED,
}

const CALL_STATUS_SCHEMA = z.object({
    status: z.union(Object.values(CALL_STATUSES).map(v => z.literal(v))),
    startingMessagesIdsByUserIds: z.record(z.string(), z.string()),
    callMeta: z.nullish(z.object()),
    callStatusToken: z.string(),
})

function isCallIdValid (callId) {
    return typeof callId === 'string'
        && callId.length >= MIN_CALL_ID_LENGTH
        && callId.length <= MAX_CALL_ID_LENGTH
        && !CALL_ID_NOT_ALLOWED_CHARACTERS_REGEX.test(callId)
}

function isCallMetaValid (callMeta) {
    if (callMeta === null || callMeta === undefined) return true
    const length = typeof callMeta === 'string' ? callMeta.length : JSON.stringify(callMeta).length
    return length <= MAX_CALL_META_LENGTH
}

function buildKey (b2cAppId, organizationId, propertyId, callId) {
    return [KEY_PREFIX, b2cAppId, organizationId, propertyId, Buffer.from(callId).toString('base64')].join(':')
}

function generateCallStatusToken () {
    return randomBytes(32).toString('base64')
}

// NOTE(YEgorLu): startingMessagesIdsByUserIds present for older mobile apps compatibility, as they use this to cancel calls.
//                Will be removed someday in the future. Should be okay to save it only for few minutes
async function setCallStatus ({ callStatusToken, b2cAppId, organizationId, propertyId, callId, status, startingMessagesIdsByUserIds, callMeta }) {
    if (!callStatusToken || !isCallIdValid(callId)) return false
    if (!isCallMetaValid(callMeta)) callMeta = null
    return kv.set(
        buildKey(b2cAppId, organizationId, propertyId, callId),
        JSON.stringify({ status, startingMessagesIdsByUserIds, callMeta, callStatusToken }),
        'EX',
        CALL_STATUS_TTL_IN_SECONDS,
    )
}

async function getCallStatus ({ callStatusToken, b2cAppId, organizationId, propertyId, callId }) {
    if (!callStatusToken || !isCallIdValid(callId)) return null
    const res = await kv.get(buildKey(b2cAppId, organizationId, propertyId, callId))
    if (!res) return null
    try {
        const parsedJSON = JSON.parse(res)
        const { success, data } = CALL_STATUS_SCHEMA.safeParse(parsedJSON)

        if (!success) return null

        const innerToken = data.callStatusToken
        if (!innerToken) return null

        const outerTokenBuffer = Buffer.from(callStatusToken, 'base64')
        const innerTokenBuffer = Buffer.from(innerToken, 'base64')
        const isEqual = timingSafeEqual(outerTokenBuffer, innerTokenBuffer)
        if (isEqual) return data
    } catch {
        return null
    }
    return null
}

module.exports = {
    isCallIdValid,
    isCallMetaValid,

    setCallStatus,
    getCallStatus,

    generateCallStatusToken,

    CALL_STATUSES,
    CALL_STATUS_STARTED,
    CALL_STATUS_ENDED,
    CALL_STATUS_ANSWERED,

    MIN_CALL_ID_LENGTH,
    MAX_CALL_ID_LENGTH,
    MAX_CALL_META_LENGTH,
}