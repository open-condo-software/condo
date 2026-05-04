const get = require('lodash/get')
const omit = require('lodash/omit')

const conf = require('@open-condo/config')
const { GQLError } = require('@open-condo/keystone/errors')
const { getByCondition, find } = require('@open-condo/keystone/schema')

const {
    DEFAULT_NOTIFICATION_WINDOW_MAX_COUNT,
    DEFAULT_NOTIFICATION_WINDOW_DURATION_IN_SECONDS,
    NATIVE_VOIP_TYPE,
    B2C_APP_VOIP_TYPE,
} = require('@condo/domains/miniapp/constants')
const { B2CAppProperty, CustomValue } = require('@condo/domains/miniapp/utils/serverSchema')
const {
    MESSAGE_META,
    VOIP_INCOMING_CALL_MESSAGE_TYPE, MESSAGE_SENDING_STATUS,
    CANCELED_CALL_MESSAGE_PUSH_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { getOldestNonDeletedProperty } = require('@condo/domains/property/utils/serverSchema/helpers')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')

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

class RejectCallError extends Error {
    constructor (returnData) {
        super('Code has no reason to go further')
        this.returnData = returnData
    }
}

function prepareVoIPCallStartMessageData ({ 
    callData, 
    b2cApp: { id: b2cAppId, name: b2cAppName },
    resident, contact, property,
    callStatusToken,
    customVoIPValues,
}) {
    // NOTE(YEgorLu): as in domains/notification/constants/config for VOIP_INCOMING_CALL_MESSAGE_TYPE
    let preparedDataArgs = {
        B2CAppId: b2cAppId,
        B2CAppName: b2cAppName,
        residentId: resident.id,
        callId: callData.callId,
        organizationId: contact.organization,
        propertyId: property.id,
        callStatusToken,
    }

    const isB2CAppCallDataIsOnlyOption = !callData.nativeCallData
    const isB2CAppCallDataProvidedAndPreferredByCustomValue = !!callData.b2cAppCallData && customVoIPValues?.voipType === B2C_APP_VOIP_TYPE
    const needToPasteB2CAppCallData = isB2CAppCallDataIsOnlyOption || isB2CAppCallDataProvidedAndPreferredByCustomValue

    if (!needToPasteB2CAppCallData) {
        let voipType = customVoIPValues?.voipType || NATIVE_VOIP_TYPE
        
        const customValuePrefersB2CAppDataButHasOnlyNativeData = customVoIPValues?.voipType === B2C_APP_VOIP_TYPE && !callData.b2cAppCallData
        // CustomValue says to use B2C_APP_VOIP_TYPE, but we have no b2cAppCallData
        if (customValuePrefersB2CAppDataButHasOnlyNativeData) {
            voipType = NATIVE_VOIP_TYPE
        }

        preparedDataArgs = {
            ...preparedDataArgs,
            voipType: voipType,
            voipAddress: callData.nativeCallData.voipAddress,
            voipLogin: callData.nativeCallData.voipLogin,
            voipPassword: callData.nativeCallData.voipPassword,
            voipDtfmCommand: callData.nativeCallData.voipPanels?.[0]?.dtmfCommand,
            voipPanels: callData.nativeCallData.voipPanels,
            stunServers: callData.nativeCallData.stunServers,
            stun: callData.nativeCallData.stunServers?.[0],
            codec: callData.nativeCallData.codec,
            ...omit(customVoIPValues, 'voipType'),
        }
    } else {
        preparedDataArgs = {
            ...preparedDataArgs,
            B2CAppContext: callData.b2cAppCallData.B2CAppContext,
        }
    }

    return preparedDataArgs
}

function prepareVoIPCallCancelMessageData ({
    callData, 
    b2cApp: { id: b2cAppId, name: b2cAppName },
    resident, contact, property,
    voipIncomingCallId,
}) {
    const preparedDataArgs = {
        B2CAppId: b2cAppId,
        B2CAppName: b2cAppName,
        residentId: resident.id,
        callId: callData.callId,
        organizationId: contact.organization,
        propertyId: property.id,
        reason: callData.reason,
        voipIncomingCallId,
    }

    if (callData.b2cAppCallData?.B2CAppContext) {
        preparedDataArgs.B2CAppContext = callData.b2cAppCallData.B2CAppContext
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
 * callStatusToken,
 * customVoIPValues,
 * resident,
 * contact,
 * user,
 * property,
 * sender,
 * dv,
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
    }, 'id user { id phone }')
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
        logContext.logInfoStats.contactsCount = verifiedResidentsWithContacts.length
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
    }, 'id app { id name }')

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

    return { b2cAppId, b2cAppName: b2cAppProperty.app.name }
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

function parseSendMessageResults ({ logContext, sendMessagePromisesResults }) {
    const sendMessageStats = sendMessagePromisesResults.map(promiseResult => {
        if (promiseResult.status === 'rejected') {
            return { error: promiseResult.reason }
        } 
        const { resident, result } = promiseResult.value

        if (result.isDuplicateMessage) {
            return { error: `${resident.id} duplicate message` }
        }
        if (result.status !== MESSAGE_SENDING_STATUS) {
            return { error: `${resident.id} invalid status for some reason` }
        }
        return promiseResult
    })

    for (const messageStat of sendMessageStats) {
        if (messageStat.error) {
            if (logContext) {
                logContext.logInfoStats.erroredMessagesCount++
                logContext.logInfoStats.createMessageErrors.push(messageStat.error)
            }
            continue
        }
        if (logContext) {
            logContext.logInfoStats.createdMessagesCount++
        }
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
            createMessageErrors: [],
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
    getCustomVoIPValuesByContacts,
    getLogInfoFn,
    checkLimits,
    getInitialLogContext,

    RejectCallError,
}