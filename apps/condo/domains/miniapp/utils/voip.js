const { z } = require('zod')

const { getKVClient } = require('@open-condo/keystone/kv')

const kv = getKVClient(KEY_PREFIX)


const KEY_PREFIX = 'voipCallStatus'
const CALL_STATUS_TTL_IN_SECONDS = 60 * 3 // 3 minutes

const MIN_CALL_ID_LENGTH = 1
const MAX_CALL_ID_LENGTH = 300

const CALL_ID_ALLOWED_CHARACTERS_REGEX = /[a-z][A-Z][0-9]\\\.,\?_\^&\$-\+\*/

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
})

function isCallIdValid (callId) {
    return typeof callId === 'string'
        && callId.length >= MIN_CALL_ID_LENGTH
        && callId.length <= MAX_CALL_ID_LENGTH
        && !CALL_ID_ALLOWED_CHARACTERS_REGEX.test(callId)
}

function buildKey (b2cAppId, callId) {
    return [KEY_PREFIX, b2cAppId, Buffer.from(callId).toString('base64')].join(':')
}

// NOTE(YEgorLu): startingMessagesIdsByUserIds present for older mobile apps compatibility, as they use this to cancel calls.
//                Will be removed someday in the future. Should be okay to save it only for few minutes
async function setCallStatus ({ b2cAppId, callId, status, startingMessagesIdsByUserIds }) {
    if (!isCallIdValid(callId)) return false
    return kv.set(
        buildKey(b2cAppId, callId),
        JSON.stringify({ status, startingMessagesIdsByUserIds }),
        'EX',
        CALL_STATUS_TTL_IN_SECONDS,
    )
}

async function getCallStatus ({ b2cAppId, callId }) {
    if (!isCallIdValid(callId)) return null
    const res = await kv.get(buildKey(b2cAppId, callId))
    try {
        const parsedJSON = JSON.parse(res)
        const { success, data } = CALL_STATUS_SCHEMA.safeParse(parsedJSON)
        if (success) return data
    } catch {
        return null
    }
    return null
}

module.exports = {
    isCallIdValid,
    setCallStatus,
    getCallStatus,

    CALL_STATUSES,
    CALL_STATUS_STARTED,
    CALL_STATUS_ENDED,
    CALL_STATUS_ANSWERED,

    MIN_CALL_ID_LENGTH,
    MAX_CALL_ID_LENGTH,
}