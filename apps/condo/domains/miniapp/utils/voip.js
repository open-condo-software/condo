const { timingSafeEqual } = require('crypto')

const jwt = require('jsonwebtoken')
const { z } = require('zod')

const conf = require('@open-condo/config')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')
const { generateUUIDv4 } = require('@open-condo/miniapp-utils/helpers/uuid')

const { CALL_STATUSES, CALL_STATUS_TTL_IN_SECONDS } = require('@condo/domains/miniapp/constants')
const KEY_PREFIX = 'voipCallStatus'
const kv = getKVClient(KEY_PREFIX)
const logger = getLogger()

const MIN_CALL_ID_LENGTH = 1
const MAX_CALL_ID_LENGTH = 300
const VOIP_CALL_STATUS_JWT_SECRET = conf.VOIP_CALL_STATUS_JWT_SECRET || generateUUIDv4() // NOTE(YEgorLu): generateUUIDv4() is only to make testing easier. In prod you should set env

const MAX_CALL_META_LENGTH = 1000

const CALL_ID_NOT_ALLOWED_CHARACTERS_REGEX = /[^a-zA-Z0-9\\/.,?_^&$\-+*]/

const CALL_STATUS_SCHEMA = z.object({
    status: z.union(Object.values(CALL_STATUSES).map(v => z.literal(v))),
    startingMessagesIdsByUserIds: z.record(z.string(), z.string()),
    callMeta: z.nullish(z.object()),
    callStatusToken: z.string(),
})

const DEFAULT_JWT_PAYLOAD_PARAMS = {
    iss: z.optional(z.string()),
    sub: z.optional(z.string()),
    aud: z.optional(z.union([z.string(), z.array(z.string())])),
    exp: z.optional(z.number()),
    nbf: z.optional(z.number()),
    iat: z.optional(z.number()),
    jti: z.optional(z.string()),
}
const DEFAULT_JWT_PAYLOAD_SCHEMA = z.strictObject(DEFAULT_JWT_PAYLOAD_PARAMS)

const JWT_PAYLOAD_SCHEMA = DEFAULT_JWT_PAYLOAD_SCHEMA.merge(z.strictObject({
    organizationId: z.uuid(),
    b2cAppId: z.uuid(),
    addressKey: z.uuid(),
    callId: z.string(),
    callStatusToken: z.string(),
})).transform(data => 
    Object.fromEntries(
        Object.entries(data)
            .filter(
                ([key]) => !(key in DEFAULT_JWT_PAYLOAD_PARAMS)
            )
    )
)



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

function buildKey (b2cAppId, organizationId, addressKey, callId) {
    return [KEY_PREFIX, b2cAppId, organizationId, addressKey, Buffer.from(callId).toString('base64')].join(':')
}

function generateCallStatusToken () {
    return generateUUIDv4()
}

/**
 * @param {z.infer<typeof JWT_PAYLOAD_SCHEMA>} data 
 * @returns 
 */
function buildCallStatusJWTToken (data) {
    try {
        const verifiedData = JWT_PAYLOAD_SCHEMA.parse(data)
        return jwt.sign(
            verifiedData,
            VOIP_CALL_STATUS_JWT_SECRET,
            { expiresIn: '1h' },
        )
    } catch (err) {
        logger.error({ msg: 'buildJWTToken error', err })
        return null
    }
}

function parseCallStatusJWTToken (jwtToken) {
    try {
        const jwtPayload = jwt.verify(jwtToken, VOIP_CALL_STATUS_JWT_SECRET)
        return JWT_PAYLOAD_SCHEMA.parse(jwtPayload)
    } catch (err) {
        logger.error({ msg: 'parseJWTToken error', err })
        return null
    }
}

// NOTE(YEgorLu): startingMessagesIdsByUserIds present for older mobile apps compatibility, as they use this to cancel calls.
//                Will be removed someday in the future. Should be okay to save it only for few minutes
async function setCallStatus ({ callStatusToken, b2cAppId, organizationId, addressKey, callId, status, startingMessagesIdsByUserIds, callMeta }) {
    if (!callStatusToken || !isCallIdValid(callId)) return false
    if (!isCallMetaValid(callMeta)) callMeta = null
    return kv.set(
        buildKey(b2cAppId, organizationId, addressKey, callId),
        JSON.stringify({ status, startingMessagesIdsByUserIds, callMeta, callStatusToken }),
        'EX',
        CALL_STATUS_TTL_IN_SECONDS,
    )
}

async function getCallStatus ({ b2cAppId, organizationId, addressKey, callId }) {
    if (!isCallIdValid(callId)) return null
    const res = await kv.get(buildKey(b2cAppId, organizationId, addressKey, callId))
    if (!res) return null
    try {
        const parsedJSON = JSON.parse(res)
        const { success, data } = CALL_STATUS_SCHEMA.safeParse(parsedJSON)

        if (!success) return null
        return data
    } catch {
        return null
    }
}

function isCallStatusTokenEqual ({ callStatusToken, callStatus }) {
    if (!callStatus?.callStatusToken || !callStatusToken) return false
    
    const outerTokenBuffer = Buffer.from(callStatusToken)
    const innerTokenBuffer = Buffer.from(callStatus.callStatusToken)

    if (outerTokenBuffer.length !== innerTokenBuffer.length) return false

    return timingSafeEqual(outerTokenBuffer, innerTokenBuffer)
}

module.exports = {
    isCallIdValid,
    isCallMetaValid,
    isCallStatusTokenEqual,

    setCallStatus,
    getCallStatus,

    generateCallStatusToken,
    buildCallStatusJWTToken,
    parseCallStatusJWTToken,

    MIN_CALL_ID_LENGTH,
    MAX_CALL_ID_LENGTH,
    MAX_CALL_META_LENGTH,
}