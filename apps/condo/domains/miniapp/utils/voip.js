const { createHmac, randomBytes, timingSafeEqual } = require('crypto')

const { z } = require('zod')

const conf = require('@open-condo/config')
const { getKVClient } = require('@open-condo/keystone/kv')
const { generateUUIDv4 } = require('@open-condo/miniapp-utils/helpers/uuid')

const { CALL_STATUSES, CALL_STATUS_TTL_IN_SECONDS } = require('@condo/domains/miniapp/constants')
const KEY_PREFIX = 'voipCallStatus'
const kv = getKVClient(KEY_PREFIX)

const MIN_CALL_ID_LENGTH = 1
const MAX_CALL_ID_LENGTH = 300
const VOIP_CALL_STATUS_JWT_SECRET = conf.VOIP_CALL_STATUS_JWT_SECRET || generateUUIDv4() // NOTE(YEgorLu): generateUUIDv4() is only to make testing easier. In prod you should set env

const STUN_PROTOCOL = 'stun'
const TURN_PROTOCOL = 'turn'
const TURNS_PROTOCOL = 'turns'
const ALLOWED_ICE_SERVER_ADDRESS_PROTOCOLS = [STUN_PROTOCOL, TURN_PROTOCOL, TURNS_PROTOCOL]
const ALLOWED_ICE_SERVER_ADDRESS_SEARCH_PARAMS = { 'transport': ['tcp'] }

const MAX_CALL_META_LENGTH = 1000

const CALL_ID_NOT_ALLOWED_CHARACTERS_REGEX = /[^a-zA-Z0-9\\/.,?_^&$\-+*@~]/
const CALL_STATUS_ID_SCHEMA = z.string().regex(/^[A-Za-z0-9_-]{21}[AQgw]$/)

const CALL_STATUS_SCHEMA = z.object({
    id: CALL_STATUS_ID_SCHEMA,
    organizationId: z.uuid(),
    b2cAppId: z.uuid(),
    addressKey: z.uuid(),
    callId: z.string().refine(isCallIdValid),
    status: z.union(Object.values(CALL_STATUSES).map(v => z.literal(v))),
    startingMessagesIdsByUserIds: z.record(z.string(), z.string()),
    callMeta: z.unknown().optional().refine(isCallMetaValid),
})

const CALL_STATUS_TOKEN_SCHEMA = z.string().regex(/^[A-Za-z0-9_-]{21}[AQgw]\.[A-Za-z0-9_-]{21}[AQgw]$/)

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

function isIceServersAddressesValid (iceServers) {
    if (!iceServers?.length) return true
    for (const iceServer of iceServers) {
        if (!iceServer?.address) {
            return false
        }
        const usedProtocol = ALLOWED_ICE_SERVER_ADDRESS_PROTOCOLS.find(protocol => iceServer.address.startsWith(`${protocol}:`))
        if (!usedProtocol) {
            return false
        }

        let url

        try {
            url = new URL(iceServer.address.replace(`${usedProtocol}:`, `${usedProtocol}://`))
        } catch {
            return false
        }

        for (const searchParamName of url.searchParams.keys()) {
            const allowedValues = ALLOWED_ICE_SERVER_ADDRESS_SEARCH_PARAMS[searchParamName]
            if (!allowedValues?.length) {
                return false
            }

            for (const searchParamValue of url.searchParams.getAll(searchParamName)) {
                if (!allowedValues.includes(searchParamValue)) {
                    return false
                }
            }
        }
    }

    return true
}

function buildKey (b2cAppId, organizationId, addressKey, callId) {
    return [KEY_PREFIX, 'identity', b2cAppId, organizationId, addressKey, Buffer.from(callId).toString('base64url')].join(':')
}

function buildStateKey (id) {
    return `${KEY_PREFIX}:id:${id}`
}

function generateCallStatusId () {
    return randomBytes(16).toString('base64url')
}

function getCallStatusSignature (id) {
    return createHmac('sha256', VOIP_CALL_STATUS_JWT_SECRET)
        .update(`voip-call:v1:${id}`)
        .digest()
        .subarray(0, 16)
}

/**
 * @param {string} id
 * @returns 
 */
function buildCallStatusToken (id) {
    if (!CALL_STATUS_ID_SCHEMA.safeParse(id).success) return null
    return `${id}.${getCallStatusSignature(id).toString('base64url')}`
}

function parseCallStatusToken (token) {
    if (!CALL_STATUS_TOKEN_SCHEMA.safeParse(token).success) return null
    const [id, signature] = token.split('.')
    return timingSafeEqual(Buffer.from(signature, 'base64url'), getCallStatusSignature(id)) ? id : null
}

// NOTE(YEgorLu): startingMessagesIdsByUserIds present for older mobile apps compatibility, as they use this to cancel calls.
//                Will be removed someday in the future. Should be okay to save it only for few minutes
async function setCallStatus ({ id, b2cAppId, organizationId, addressKey, callId, status, startingMessagesIdsByUserIds, callMeta }) {
    if (!isCallMetaValid(callMeta)) callMeta = null
    const parsed = CALL_STATUS_SCHEMA.safeParse({
        id, b2cAppId, organizationId, addressKey, callId, status, startingMessagesIdsByUserIds, callMeta,
    })
    if (!parsed.success) return false
    await kv.set(buildStateKey(id), JSON.stringify(parsed.data), 'EX', CALL_STATUS_TTL_IN_SECONDS)
    return kv.set(
        buildKey(b2cAppId, organizationId, addressKey, callId),
        id,
        'EX',
        CALL_STATUS_TTL_IN_SECONDS,
    )
}

async function getCallStatus ({ b2cAppId, organizationId, addressKey, callId }) {
    if (!isCallIdValid(callId)) return null
    const id = await kv.get(buildKey(b2cAppId, organizationId, addressKey, callId))
    const data = await getCallStatusById(id)
    if (!data || data.b2cAppId !== b2cAppId || data.organizationId !== organizationId || data.addressKey !== addressKey || data.callId !== callId) return null
    return data
}

async function getCallStatusById (id) {
    if (!CALL_STATUS_ID_SCHEMA.safeParse(id).success) return null
    const res = await kv.get(buildStateKey(id))
    if (!res) return null
    try {
        const parsedJSON = JSON.parse(res)
        const { success, data } = CALL_STATUS_SCHEMA.safeParse(parsedJSON)

        if (!success || data.id !== id) return null
        return data // NOTE(YEgorLu): to clear fields outside the call status schema and normal type hint
    } catch {
        return null
    }
}

module.exports = {
    isCallIdValid,
    isCallMetaValid,

    setCallStatus,
    getCallStatus,
    getCallStatusById,

    generateCallStatusId,
    buildCallStatusToken,
    parseCallStatusToken,

    isIceServersAddressesValid,

    MIN_CALL_ID_LENGTH,
    MAX_CALL_ID_LENGTH,
    MAX_CALL_META_LENGTH,

    CALL_STATUS_TTL_IN_SECONDS,

    STUN_PROTOCOL,
    TURN_PROTOCOL,
    TURNS_PROTOCOL,
    ALLOWED_ICE_SERVER_ADDRESS_PROTOCOLS,
    ALLOWED_ICE_SERVER_ADDRESS_SEARCH_PARAMS,
}