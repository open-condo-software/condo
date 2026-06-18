const dayjs = require('dayjs')
const get = require('lodash/get')
const omit = require('lodash/omit')
const { z } = require('zod')

const conf = require('@open-condo/config')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT, NOT_FOUND } } = require('@open-condo/keystone/errors')
const { getByCondition, find } = require('@open-condo/keystone/schema')

const {
    DEFAULT_NOTIFICATION_WINDOW_MAX_COUNT,
    DEFAULT_NOTIFICATION_WINDOW_DURATION_IN_SECONDS,
    NATIVE_VOIP_TYPE,
    B2C_APP_VOIP_TYPE,
    SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED,
    INVALID_CALL_ID_ERROR,
    CALL_NOT_FOUND_ERROR,
} = require('@condo/domains/miniapp/constants')
const { B2CAppProperty, CustomValue } = require('@condo/domains/miniapp/utils/serverSchema')
const { CALL_STATUS_TTL_IN_SECONDS, MIN_CALL_ID_LENGTH, MAX_CALL_ID_LENGTH, STUN_PROTOCOL } = require('@condo/domains/miniapp/utils/voip')
const { GET_VOIP_CALL_STATUS_URL_PATH, SEND_DTMF_TO_B2C_APP_URL_PATH } = require('@condo/domains/miniapp/VoIPMiddleware')
const {
    MESSAGE_META,
    VOIP_INCOMING_CALL_MESSAGE_TYPE, MESSAGE_SENDING_STATUS,
    CANCELED_CALL_MESSAGE_PUSH_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { getOldestNonDeletedProperty } = require('@condo/domains/property/utils/serverSchema/helpers')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')


const CALLER_DEVICE_ID_UNIQ_KEY_PREFIX = 'CALLER_DEVICE_ID'
const SERVER_URL = conf.SERVER_URL

const VOIP_MESSAGE_TYPES = [
    VOIP_INCOMING_CALL_MESSAGE_TYPE,
    CANCELED_CALL_MESSAGE_PUSH_TYPE,
]
const POSSIBLE_CUSTOM_FIELD_NAMES_BY_MESSAGE_TYPE = VOIP_MESSAGE_TYPES.reduce((byMessageType, messageType) => {
    const fieldNames = Object.keys(get(MESSAGE_META[messageType], 'data', {})).filter(key => key.startsWith('voip'))
    byMessageType[messageType] = fieldNames
    return byMessageType
}, {})

const VOIP_MESSAGE_DATA_PREPARERS = {
    [VOIP_INCOMING_CALL_MESSAGE_TYPE]: prepareVoIPCallStartMessageData,
    [CANCELED_CALL_MESSAGE_PUSH_TYPE]: prepareVoIPCallCancelMessageData,
}

const CACHE_TTL = {
    DEFAULT: DEFAULT_NOTIFICATION_WINDOW_DURATION_IN_SECONDS,
    [VOIP_INCOMING_CALL_MESSAGE_TYPE]: 2,
    [CANCELED_CALL_MESSAGE_PUSH_TYPE]: 2,
}

const ANY_RECORD_SCHEMA = z.record(z.union([z.string(), z.number()]), z.unknown())

const GLOBAL_SEND_VOIP_MESSAGE_WINDOW_IN_SECODS = 60 * 60 // 1 minute
// 1 intercom ~ 1 call per 15 seconds (judged by call span) ~ 4 calls per minute max
// 1 house ~ 1 - 10 intercoms max
// 1 house with closed area ~ 4 gates with intercoms max
// 1 house ~ 14 intercoms = 56 calls per minute max
// B2CApp has connection to N block of houses with M houses in each. Lets think that block of houses ~ 4 houses, and miniapp has 20 blocks 
// And multiply by 2 for error margin
// NOTE(YEgorLu): maybe need to add global field for AppMessageSetting
const DEFAULT_GLOBAL_SEND_VOIP_MESSAGE_CALLS_WINDOW_SEC = 4 * (10 + 4) * 4 * 20 * 2 // 8960
const GLOBAL_SEND_VOIP_MESSAGE_CALLS_WINDOW_SEC_BY_APP_ID = JSON.parse(conf.GLOBAL_SEND_VOIP_MESSAGE_CALLS_WINDOW_SEC_BY_APP_ID || '{}')

const MAX_UNIT_NAME_LANEGTH = 100

const COMMON_VOIP_ERRORS = {
    INVALID_CALL_ID: {
        variable: ['data', 'callId'],
        type: INVALID_CALL_ID_ERROR,
        code: BAD_USER_INPUT,
        message: `"callId" contains invalid characters or does not have length between ${MIN_CALL_ID_LENGTH} and ${MAX_CALL_ID_LENGTH}`,
    },
    CALL_NOT_FOUND: {
        variable: ['data', 'callId'],
        code: NOT_FOUND,
        type: CALL_NOT_FOUND_ERROR,
        message: 'Call for that callId is already ended or never existed',
    },
}

class RejectCallError extends Error {
    constructor (returnData) {
        super('Code has no reason to go further')
        this.returnData = returnData
    }
}

function getGetVoIPCallStatusUrl ({ dv, sender, callStatusJwtToken }) {
    if (typeof dv !== 'number' || !sender || !callStatusJwtToken) return null
    const url = new URL(`${SERVER_URL}${GET_VOIP_CALL_STATUS_URL_PATH}`)
    const queryData = JSON.stringify({ dv, sender, token: callStatusJwtToken })
    url.searchParams.set('data', queryData)
    return url.toString()
}

function getGetVoIPCallStatusTimeout () {
    return dayjs().add(CALL_STATUS_TTL_IN_SECONDS, 'second').toISOString()
}

function getSendDTMFUrl ({ dv, sender, callStatusJwtToken, dtmfCode }) {
    if (typeof dv !== 'number' || !sender || !callStatusJwtToken) return null
    const baseSendDTMFUrl = new URL(`${SERVER_URL}${SEND_DTMF_TO_B2C_APP_URL_PATH}`)
    baseSendDTMFUrl.searchParams.set('data', JSON.stringify({ dv, sender, token: callStatusJwtToken, data: { dtmfCode } }))
    return baseSendDTMFUrl.toString()
}

function getSendDTMFTimeout () {
    return dayjs().add(CALL_STATUS_TTL_IN_SECONDS, 'second').toISOString()
}

function isObject (obj) {
    return ANY_RECORD_SCHEMA.safeParse(obj).success
}

function isNonEmptyObject (obj) {
    if (!isObject(obj)) return false
    return Object.keys(obj).length > 0
}

const VOIP_DEVICE_DATA_CUSTOM_FIELD_NAME = 'voipDeviceData'

const VOIP_DEVICE_DATA_CUSTOM_VALUE_SCHEMA = z.object({
    streamUrl: z.url().optional().catch(),
    voipPanels: z.array(
        z.object({
            name: z.string().optional().catch(),
            dtmfCommand: z.string(),
            openUrl: z.string().optional().catch(),
        }).catch()
    ).optional().catch(() => ([])).transform((arrOrUndefined) => Array.isArray(arrOrUndefined) ? arrOrUndefined.filter(Boolean) : arrOrUndefined),
})

const VOIP_DEVICE_B2C_APP_CONTEXT_CUSTOM_FIELD_NAME = 'voipDeviceB2CAppContext'

const VOIP_DEVICE_B2C_APP_CONTEXT_INJECT_METHOD_SPREAD = 'spread'
const VOIP_DEVICE_B2C_APP_CONTEXT_INJECT_METHODS = [
    VOIP_DEVICE_B2C_APP_CONTEXT_INJECT_METHOD_SPREAD,
]


const VOIP_DEVICE_B2C_APP_CONTEXT_CUSTOM_VALUE_SCHEMA = z.object({
    data: z.record(z.union([z.string(), z.number()]), z.unknown()).default({}).catch({}),
    injectMethod: z.union(VOIP_DEVICE_B2C_APP_CONTEXT_INJECT_METHODS.map(method => z.literal(method))).optional().default(VOIP_DEVICE_B2C_APP_CONTEXT_INJECT_METHOD_SPREAD), // NOTE(YEgorLu): if need to add different injection, { ...a, ...b } by default
})

function prepareVoIPCallStartMessageData ({ 
    callData, 
    b2cApp: { id: b2cAppId, name: b2cAppName },
    resident, contact,
    property,
    callStatusJwtToken,
    customVoIPValues = {},
    hasSendDTMFUrl,
    sender,
    voipDeviceB2CAppContext,
    voipDeviceData,
}) {
    // NOTE(YEgorLu): as in domains/notification/constants/config for VOIP_INCOMING_CALL_MESSAGE_TYPE
    let preparedDataArgs = {
        B2CAppId: b2cAppId,
        B2CAppName: b2cAppName,
        residentId: resident.id,
        callId: callData.callId,
        address: resident.address,
        callStatusJwtToken,
    }

    const getVoIPCallStatusUrl = getGetVoIPCallStatusUrl({ dv: 1, sender, callStatusJwtToken })
    const getVoIPCallStatusTimeout = getGetVoIPCallStatusTimeout()
    if (getVoIPCallStatusUrl && getVoIPCallStatusTimeout) {
        preparedDataArgs = {
            ...preparedDataArgs,
            getVoIPCallStatusUrl,
            getVoIPCallStatusTimeout,
        }
    }

    const isB2CAppCallDataIsOnlyOption = !callData.nativeCallData
    const isB2CAppCallDataProvidedAndPreferredByCustomValue = !!callData.b2cAppCallData && customVoIPValues.voipType === B2C_APP_VOIP_TYPE
    const needToPasteB2CAppCallData = isB2CAppCallDataIsOnlyOption || isB2CAppCallDataProvidedAndPreferredByCustomValue

    if (!needToPasteB2CAppCallData) {
        let voipType = customVoIPValues?.voipType || NATIVE_VOIP_TYPE
        
        const customValuePrefersB2CAppDataButHasOnlyNativeData = customVoIPValues.voipType === B2C_APP_VOIP_TYPE && !callData.b2cAppCallData
        // CustomValue says to use B2C_APP_VOIP_TYPE, but we have no b2cAppCallData
        if (customValuePrefersB2CAppDataButHasOnlyNativeData) {
            voipType = NATIVE_VOIP_TYPE
        }

        const firstStunServerInIceCandidates = callData.nativeCallData.iceServers?.find(iceServer => 
            iceServer.address.startsWith(`${STUN_PROTOCOL}:`)
        )
        const firstStunAddressFromIceCandidates = firstStunServerInIceCandidates?.address
            ? firstStunServerInIceCandidates.address.slice(`${STUN_PROTOCOL}:`.length)
            : null

        preparedDataArgs = {
            ...preparedDataArgs,
            voipType: voipType,
            voipAddress: callData.nativeCallData.voipAddress,
            voipLogin: callData.nativeCallData.voipLogin,
            voipPassword: callData.nativeCallData.voipPassword,
            voipDtfmCommand: callData.nativeCallData.voipPanels[0]?.dtmfCommand,
            voipPanels: callData.nativeCallData.voipPanels,
            voipIceServers: callData.nativeCallData.iceServers,
            stun: firstStunAddressFromIceCandidates ? firstStunAddressFromIceCandidates : callData.nativeCallData.stunServers?.[0],
            codec: callData.nativeCallData.codec,
            ...omit(customVoIPValues, 'voipType'),
        }
        if (hasSendDTMFUrl && callStatusJwtToken && !customVoIPValues?.voipPanels) {
            preparedDataArgs.voipPanels = preparedDataArgs.voipPanels.map(panel => {
                if (!panel.dtmfCommand) return panel
                const sendDTMFUrl = getSendDTMFUrl({ dv: 1, sender, callStatusJwtToken, dtmfCode: panel.dtmfCommand })
                if (!sendDTMFUrl) return panel
                return { ...panel, sendDTMFUrl }
            })
            preparedDataArgs.sendDTMFTimeout = getSendDTMFTimeout()
        }

        const { data: parsedVoipDeviceData, success: isVoipDeviceDataSuccess } = VOIP_DEVICE_DATA_CUSTOM_VALUE_SCHEMA.safeParse(voipDeviceData)
        if (isVoipDeviceDataSuccess) {
            if (parsedVoipDeviceData.streamUrl) {
                preparedDataArgs.streamUrl = parsedVoipDeviceData.streamUrl
            }

            if (parsedVoipDeviceData.voipPanels) {
                const originalVoIPPanelsByDtmfCommand = preparedDataArgs.voipPanels.reduce((byDtmf, panel) => {
                    byDtmf[panel.dtmfCommand] = panel
                    return byDtmf
                }, {})
                for (const voipPanel of parsedVoipDeviceData.voipPanels) {
                    if (originalVoIPPanelsByDtmfCommand[voipPanel.dtmfCommand]) {
                        Object.assign(originalVoIPPanelsByDtmfCommand[voipPanel.dtmfCommand], voipPanel)
                    } else {
                        if (!preparedDataArgs.voipPanels) preparedDataArgs.voipPanels = []
                        preparedDataArgs.voipPanels.push(voipPanel)
                    }
                }
            
                if (preparedDataArgs.voipPanels.length && !preparedDataArgs.voipDtfmCommand) {
                    preparedDataArgs.voipDtfmCommand = preparedDataArgs.voipPanels[0].dtmfCommand
                }
            }
        }

        preparedDataArgs = { ...preparedDataArgs, ...omit(customVoIPValues, 'voipType') }
    } else {
        preparedDataArgs = {
            ...preparedDataArgs,
            B2CAppContext: callData.b2cAppCallData.B2CAppContext,
        }
    }

    const { data: parsedVoipDeviceB2CAppContext, success: isVoipDeviceB2CAppContextSuccess } = VOIP_DEVICE_B2C_APP_CONTEXT_CUSTOM_VALUE_SCHEMA.safeParse(voipDeviceB2CAppContext)
    if (isVoipDeviceB2CAppContextSuccess) {
        if (isObject(preparedDataArgs.B2CAppContext) && isNonEmptyObject(parsedVoipDeviceB2CAppContext.data)) {
            preparedDataArgs.B2CAppContext = { ...parsedVoipDeviceB2CAppContext.data, ...preparedDataArgs.B2CAppContext }
        }
    }

    for (const jsonKey of ['voipPanels', 'stunServers', 'B2CAppContext', 'voipIceServers']) {
        if (!preparedDataArgs[jsonKey] || customVoIPValues[jsonKey] || typeof preparedDataArgs[jsonKey] !== 'object') continue
        preparedDataArgs[jsonKey] = JSON.stringify(preparedDataArgs[jsonKey])
    }

    return preparedDataArgs
}

function prepareVoIPCallCancelMessageData ({
    callData, 
    b2cApp: { id: b2cAppId, name: b2cAppName },
    resident,
    voipIncomingCallId,
    hasSendDTMFUrl,
}) {
    const preparedDataArgs = {
        B2CAppId: b2cAppId,
        B2CAppName: b2cAppName,
        residentId: resident.id,
        callId: callData.callId,
        reason: callData.reason,
        voipIncomingCallId,
        address: resident.address,
        getVoIPCallStatusTimeout: getGetVoIPCallStatusTimeout(),
    }

    if (hasSendDTMFUrl && callData.reason !== SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED) {
        preparedDataArgs.sendDTMFTimeout = getSendDTMFTimeout()
    }

    return preparedDataArgs
}

/**
 * @param {{
 * context,
 * voipMessageType: VOIP_INCOMING_CALL_MESSAGE_TYPE | CANCELED_CALL_MESSAGE_PUSH_TYPE,
 * b2cApp: { id: string, name: string },
 * callData: {
 *  callId: string,
 *  reason: string,
 *  nativeCallData,
 *  b2cAppCallData,
 * },
 * callStatusJwtToken,
 * customVoIPValues,
 * resident,
 * contact,
 * user,
 * property,
 * sender,
 * dv,
 * hasSendDTMFUrl,
 * voipDeviceB2CAppContext
 * voipDeviceData,
 * }} args 
 * @returns 
 */
async function sendMessageToUser (args) {
    const {
        voipMessageType,
        context, resident, contact, user,
        sender, dv,
    } = args

    const dataPreparer = VOIP_MESSAGE_DATA_PREPARERS[voipMessageType]
    if (!dataPreparer) throw new Error(`No preparer for message type ${voipMessageType}`)
    
    const preparedDataArgs = dataPreparer(args)
    
    const requiredMetaData = get(MESSAGE_META[voipMessageType], 'data', {})
    const metaData = Object.fromEntries(
        Object.keys(requiredMetaData).map((key) => [key, preparedDataArgs[key]])
    )

    const messageAttrs = {
        sender,
        type: voipMessageType,
        to: { user: { id: user.id } },
        meta: {
            dv,
            title: '', // NOTE(YEgorLu): title and body are rewritten by translations for push type
            body: '',
            data: metaData,
        },
    }

    const result = await sendMessage(context, messageAttrs)
    return { resident, contact, user, result }
}

async function getVerifiedResidentsWithContacts ({ context, logContext, addressKey, unitName, unitType }) {
    let verifiedResidentsWithContacts = []

    const oldestProperty = await getOldestNonDeletedProperty({ addressKey })
    if (logContext) {
        logContext.logInfoStats.step = 'find property'
        logContext.logInfoStats.propertyFound = !!oldestProperty
    }

    if (!oldestProperty?.id) {
        throw new RejectCallError({
            verifiedContactsCount: 0,
            createdMessagesCount: 0,
            erroredMessagesCount: 0,
        })
    }

    const allVerifiedContactsOnUnit = await find('Contact', {
        property: { id: oldestProperty.id, deletedAt: null },
        unitName_i: unitName,
        unitType: unitType,
        isVerified: true,
        deletedAt: null,
    })
    if (logContext) {
        logContext.logInfoStats.step = 'find contacts'
        logContext.logInfoStats.contactsCount = allVerifiedContactsOnUnit.length
    }

    if (!allVerifiedContactsOnUnit.length) {
        throw new RejectCallError({
            verifiedContactsCount: 0,
            createdMessagesCount: 0,
            erroredMessagesCount: 0,
        })
    }

    const allResidentsOnUnit = await Resident.getAll(context, {
        addressKey,
        unitName_i: unitName,
        unitType,
        deletedAt: null,
    }, 'id user { id phone } address')
    if (logContext) {
        logContext.logInfoStats.step = 'find residents'
        logContext.logInfoStats.residentsCount = allResidentsOnUnit.length
    }

    if (!allResidentsOnUnit.length) {
        throw new RejectCallError({
            verifiedContactsCount: allVerifiedContactsOnUnit.length,
            createdMessagesCount: 0,
            erroredMessagesCount: 0,
        })
    }

    const verifiedResidentsWithContactsByPhone = {}

    for (const contact of allVerifiedContactsOnUnit) {
        if (!contact.phone) continue

        const verifiedResidentWithContact = { contact, resident: null, user: null }
        verifiedResidentsWithContacts.push(verifiedResidentWithContact)
        verifiedResidentsWithContactsByPhone[verifiedResidentWithContact.contact.phone] = verifiedResidentWithContact
    }

    for (const resident of allResidentsOnUnit) {
        const phone = resident.user.phone
        if (!phone || !verifiedResidentsWithContactsByPhone[phone]) continue
        verifiedResidentsWithContactsByPhone[phone].resident = resident
        verifiedResidentsWithContactsByPhone[phone].user = resident.user
    }

    verifiedResidentsWithContacts = verifiedResidentsWithContacts.filter(({ resident, user, contact }) => !!resident && !!contact && !!user)

    if (logContext) {
        logContext.logInfoStats.step = 'find verified residents'
        logContext.logInfoStats.verifiedResidentsCount = verifiedResidentsWithContacts.length
    }

    if (!verifiedResidentsWithContacts.length) {
        throw new RejectCallError({
            verifiedContactsCount: allVerifiedContactsOnUnit.length,
            createdMessagesCount: 0,
            erroredMessagesCount: 0,
        })
    }
   
    return {
        verifiedResidentsWithContacts,
        allVerifiedContactsOnUnit,
        property: oldestProperty,
        organization: { id: oldestProperty.organization },
    }
}

async function getAppInfo ({ context, propertyNotFoundError, logContext, addressKey, app }) {
    const b2cAppId = app.id

    const b2cAppProperty = await B2CAppProperty.getOne(context, { 
        app: { id: b2cAppId, deletedAt: null },
        addressKey: addressKey,
        deletedAt: null,
    }, 'id app { id name intercomConfig { sendDTMFUrl } }')

    if (!b2cAppProperty) {
        if (logContext) {
            logContext.logInfoStats.step = 'find property'
        }
        throw new GQLError(propertyNotFoundError, context)
    }
    if (logContext) {
        logContext.logInfoStats.isPropertyFound = true
        logContext.logInfoStats.isAppFound = true
    }

    return { b2cAppId, b2cAppName: b2cAppProperty.app.name, hasSendDTMFUrl: !!b2cAppProperty.app.intercomConfig?.sendDTMFUrl }
}

async function getCustomVoIPValuesByContacts ({ context, contactIds, voipMessageType }) {
    const possibleCustomFieldNames = POSSIBLE_CUSTOM_FIELD_NAMES_BY_MESSAGE_TYPE[voipMessageType]
    if (!possibleCustomFieldNames || !possibleCustomFieldNames.length) return {}

    const customVoIPValues = await CustomValue.getAll(context, {
        customField: { 
            name_in: possibleCustomFieldNames, 
            modelName: 'Contact', 
            deletedAt: null,
        },
        itemId_in: contactIds,
        deletedAt: null,
    }, 'id itemId data customField { name }')
    return customVoIPValues.reduce((byContactId, customValue) => {
        if (!byContactId[customValue.itemId]) byContactId[customValue.itemId] = {}
        byContactId[customValue.itemId][customValue.customField.name] = customValue.data
        return byContactId
    }, {})
}

async function getVoIPDeviceB2CAppContext ({ context, propertyId, callerDeviceId }) {
    if (!propertyId || !callerDeviceId) return null

    const value = await CustomValue.getOne(context, {
        customField: {
            name: VOIP_DEVICE_B2C_APP_CONTEXT_CUSTOM_FIELD_NAME,
            modelName: 'Property',
            deletedAt: null,
        },
        itemId: propertyId,
        uniqKey: `${CALLER_DEVICE_ID_UNIQ_KEY_PREFIX}:${callerDeviceId}`,
    }, 'id data')

    return value?.data
}

async function getVoIPDeviceData ({ context, propertyId, callerDeviceId }) {
    if (!propertyId || !callerDeviceId) return null

    const value = await CustomValue.getOne(context, {
        customField: {
            name: VOIP_DEVICE_DATA_CUSTOM_FIELD_NAME,
            modelName: 'Property',
            deletedAt: null,
        },
        itemId: propertyId,
        uniqKey: `${CALLER_DEVICE_ID_UNIQ_KEY_PREFIX}:${callerDeviceId}`,
    }, 'id data')
    return value?.data
}

function parseSendMessageResults ({ logContext, sendMessagePromisesResults }) {
    const sendMessageStats = sendMessagePromisesResults.map(promiseResult => {
        if (promiseResult.status === 'rejected') {
            return { success: false, error: promiseResult.reason }
        } 
        
        const { user, resident, contact, result } = promiseResult.value

        const userData = { userId: user.id, contactId: contact.id, residentId: resident.id }
        const sendMessageResult = { id: result?.id, status: result?.status, isDuplicateMessage: result?.isDuplicateMessage }

        if (result.isDuplicateMessage || result.status !== MESSAGE_SENDING_STATUS) {
            return { ...userData, result: sendMessageResult, success: false }
        }
        return { ...userData, result: sendMessageResult, success: true }
    })

    if (!logContext) return sendMessageStats

    for (const messageStat of sendMessageStats) {
        if (!messageStat.success) {
            logContext.logInfoStats.erroredMessagesCount++
        } else {
            logContext.logInfoStats.createdMessagesCount++
        }
        logContext.logInfoStats.createMessageResults.push(messageStat)
    }

    return sendMessageStats
}

function getLogInfoFn ({ logger, serviceName }) {
    return function ({ b2cAppId, callId, logInfoStats, err }) {
        logger.info({ msg: `${serviceName} stats`, entityName: 'B2CApp', entityId: b2cAppId, data: { callId, stats: logInfoStats }, err: err })
    }
}

async function checkGlobalLimit ({ voipMessageType, redisGuard, serviceName, context, b2cAppId }) {

    const searchKey = `${voipMessageType}-${b2cAppId}`

    const callsInWindow = typeof GLOBAL_SEND_VOIP_MESSAGE_CALLS_WINDOW_SEC_BY_APP_ID[b2cAppId] === 'number' 
        ? GLOBAL_SEND_VOIP_MESSAGE_CALLS_WINDOW_SEC_BY_APP_ID[b2cAppId]
        : DEFAULT_GLOBAL_SEND_VOIP_MESSAGE_CALLS_WINDOW_SEC

    await redisGuard.checkCustomLimitCounters(
        `${serviceName}-${searchKey}`,
        GLOBAL_SEND_VOIP_MESSAGE_WINDOW_IN_SECODS,
        callsInWindow,
        context,
    )
}

async function checkUnitLimit ({ voipMessageType, redisGuard, serviceName, context, b2cAppId, addressKey, unitName, unitType }) {
    const appSettings = await getByCondition('AppMessageSetting', {
        b2cApp: { id: b2cAppId },
        type: voipMessageType,
        deletedAt: null,
    })

    if (unitName.length > MAX_UNIT_NAME_LANEGTH) {
        unitName = unitName.slice(0, MAX_UNIT_NAME_LANEGTH)
    }
                
    const searchKey = `${voipMessageType}-${b2cAppId}-${addressKey}-${unitName}-${unitType}`
    const ttl = CACHE_TTL[voipMessageType] || CACHE_TTL['DEFAULT']

    await redisGuard.checkCustomLimitCounters(
        `${serviceName}-${searchKey}`,
        appSettings?.notificationWindowSize ?? ttl,
        appSettings?.numberOfNotificationInWindow ?? DEFAULT_NOTIFICATION_WINDOW_MAX_COUNT,
        context,
    )
}

/**
 * 
 * @param {{ voipMessageType, redisGuard, serviceName, context, b2cAppId, addressKey, unitName, unitType, logContext }} mutationCallContext 
 */
async function checkLimits (mutationCallContext) {
    const { logContext } = mutationCallContext

    const limitsPromises = await Promise.allSettled([
        checkGlobalLimit(mutationCallContext),
        checkUnitLimit(mutationCallContext),
    ])

    const rejectedPromises = limitsPromises.filter(p => p.status === 'rejected')

    if (rejectedPromises.length) {
        const err = new AggregateError(rejectedPromises.map(p => p.reason))
        if (logContext) {
            logContext.logInfoStats.step = 'check limits'
            logContext.err = err
        }
        throw err
    }
}

function getInitialLogContext ({ addressKey, unitName, unitType, app, callData }) {
    return {
        logInfoStats: {
            step: 'init',
            addressKey,
            unitName,
            unitType,
            verifiedContactsCount: 0,
            residentsCount: 0,
            verifiedResidentsCount: 0,
            createdMessagesCount: 0,
            erroredMessagesCount: 0,
            createMessageResults: [],
            isStatusCached: false,
            isPropertyFound: false,
            isAppFound: false,
        },
        b2cAppId: app.id,
        callId: callData.callId,
    }
}

module.exports = {
    getVerifiedResidentsWithContacts,
    getAppInfo,
    sendMessageToUser,
    parseSendMessageResults,
    getLogInfoFn,
    checkLimits,
    getInitialLogContext,

    getCustomVoIPValuesByContacts,
    getVoIPDeviceB2CAppContext,
    getVoIPDeviceData,

    RejectCallError,

    COMMON_VOIP_ERRORS,
    CALLER_DEVICE_ID_UNIQ_KEY_PREFIX,
    VOIP_DEVICE_DATA_CUSTOM_FIELD_NAME,
    VOIP_DEVICE_B2C_APP_CONTEXT_CUSTOM_FIELD_NAME,
    VOIP_DEVICE_B2C_APP_CONTEXT_INJECT_METHODS,
}