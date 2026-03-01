const { getKVClient } = require('@open-condo/keystone/kv')

const KEY_PREFIX = 'voipCallStatus'
const kv = getKVClient(KEY_PREFIX)
const CALL_STATUS_TTL_IN_SECONDS = 60 * 3

const CALL_STATUS_START_SENT = 'CALL_STATUS_START_SENT'
const CALL_STATUS_CANCEL_SENT = 'CALL_STATUS_CANCEL_SENT'
const CALL_STATUSES = {
    CALL_STATUS_START_SENT: CALL_STATUS_START_SENT,
    CALL_STATUS_CANCEL_SENT: CALL_STATUS_CANCEL_SENT,
}

function validateCallId (callId) {
    return typeof callId === 'string'
        && callId.length > 0
        && callId.length < 300
}

function normalizeCallId (callId) {
    return callId
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\s]/g, '')
}

function buildKey (b2cAppId, callId) {
    return [KEY_PREFIX, b2cAppId, Buffer.from(callId).toString('base64')].join(':')
}

// NOTE(YEgorLu): startingMessagesIdsByUserIds present for older mobile apps compatibility, as they use this to cancel calls.
//                Will be removed someday in the future. Should be okay to save it only for few minutes
async function setCallStatus ({ b2cAppId, callId, status, startingMessagesIdsByUserIds }) {
    if (!validateCallId(callId)) return false
    return kv.set(
        buildKey(b2cAppId, normalizeCallId(callId)),
        JSON.stringify({ status, startingMessagesIdsByUserIds }),
        'EX',
        CALL_STATUS_TTL_IN_SECONDS,
    )
}

async function getCallStatus ({ b2cAppId, callId }) {
    if (!validateCallId(callId)) return null
    const res = await kv.get(buildKey(b2cAppId, normalizeCallId(callId)))
    try {
        return JSON.parse(res)
    } catch {
        return null
    }
}

module.exports = {
    setCallStatus,
    getCallStatus,

    CALL_STATUSES,
    CALL_STATUS_START_SENT,
    CALL_STATUS_CANCEL_SENT,
}