const get = require('lodash/get')
const omit = require('lodash/omit')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { getLogger } = require('@open-condo/keystone/logging')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { GQLCustomSchema, find, getByCondition } = require('@open-condo/keystone/schema')

const { COMMON_ERRORS } = require('@condo/domains/common/constants/errors')
const access = require('@condo/domains/miniapp/access/SendVoIPCallStartMessageService')
const {
    PROPERTY_NOT_FOUND_ERROR,
    DEFAULT_NOTIFICATION_WINDOW_MAX_COUNT,
    DEFAULT_NOTIFICATION_WINDOW_DURATION_IN_SECONDS,
    CALL_DATA_NOT_PROVIDED_ERROR,
    NATIVE_VOIP_TYPE,
    B2C_APP_VOIP_TYPE,
    INVALID_CALL_ID_ERROR,
    INVALID_CALL_META_ERROR,
} = require('@condo/domains/miniapp/constants')
const { B2CAppProperty, CustomValue } = require('@condo/domains/miniapp/utils/serverSchema')
const { setCallStatus, generateCallStatusToken, isCallIdValid, CALL_STATUS_STARTED, MIN_CALL_ID_LENGTH, MAX_CALL_ID_LENGTH, MAX_CALL_META_LENGTH, isCallMetaValid } = require('@condo/domains/miniapp/utils/voip')
const {
    MESSAGE_META,
    VOIP_INCOMING_CALL_MESSAGE_TYPE, MESSAGE_SENDING_STATUS,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { UNIT_TYPES } = require('@condo/domains/property/constants/common')
const { getOldestNonDeletedProperty } = require('@condo/domains/property/utils/serverSchema/helpers')
const { Resident } = require('@condo/domains/resident/utils/serverSchema') 
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const CACHE_TTL = {
    DEFAULT: DEFAULT_NOTIFICATION_WINDOW_DURATION_IN_SECONDS,
    [VOIP_INCOMING_CALL_MESSAGE_TYPE]: 2,
}

const POSSIBLE_CUSTOM_FIELD_NAMES = Object.keys(get(MESSAGE_META[VOIP_INCOMING_CALL_MESSAGE_TYPE], 'data', {})).filter(key => key.startsWith('voip'))
const redisGuard = new RedisGuard()

const logger = getLogger()

const SERVICE_NAME = 'sendVoIPCallStartMessage'
const ERRORS = {
    PROPERTY_NOT_FOUND: {
        mutation: SERVICE_NAME,
        variable: ['data', 'addressKey'],
        code: BAD_USER_INPUT,
        type: PROPERTY_NOT_FOUND_ERROR,
        message: 'Unable to find Property or B2CAppProperty by provided addressKey',
    },
    CALL_DATA_NOT_PROVIDED: {
        mutation: SERVICE_NAME,
        variable: ['data, callData'],
        type: CALL_DATA_NOT_PROVIDED_ERROR,
        code: BAD_USER_INPUT,
        message: '"b2cAppCallData" or "nativeCallData" or both should be provided',
    },
    DV_VERSION_MISMATCH: {
        ...COMMON_ERRORS.DV_VERSION_MISMATCH,
        mutation: SERVICE_NAME,
    },
    WRONG_SENDER_FORMAT: {
        ...COMMON_ERRORS.WRONG_SENDER_FORMAT,
        mutation: SERVICE_NAME,
    },
    INVALID_CALL_ID: {
        mutation: SERVICE_NAME,
        variable: ['data', 'callData', 'callId'],
        type: INVALID_CALL_ID_ERROR,
        code: BAD_USER_INPUT,
        message: `"callId" contains invalid characters or does not has length between ${MIN_CALL_ID_LENGTH} and ${MAX_CALL_ID_LENGTH}`,
    },
    INVALID_CALL_META: {
        mutation: SERVICE_NAME,
        variable: ['data', 'callData', 'callMeta'],
        type: INVALID_CALL_META_ERROR,
        code: BAD_USER_INPUT,
        message: `"callMeta" exceeds maximum length of ${MAX_CALL_META_LENGTH}`,
    },
}

class RejectCallError extends Error {
    constructor (returnData) {
        super('Mutation has no reason to go further')
        this.returnData = returnData
    }
}

function logInfo ({ b2cAppId, callId, stats, err }) {
    logger.info({ msg: `${SERVICE_NAME} stats`, entityName: 'B2CApp', entityId: b2cAppId, data: { callId, stats }, err: err })
}

async function checkLimits ({ context, b2cAppId, logContext }) {
    const appSettings = await getByCondition('AppMessageSetting', {
        b2cApp: { id: b2cAppId }, 
        type: VOIP_INCOMING_CALL_MESSAGE_TYPE, 
        deletedAt: null, 
    })
                
    const searchKey = `${VOIP_INCOMING_CALL_MESSAGE_TYPE}-${b2cAppId}`
    const ttl = CACHE_TTL[VOIP_INCOMING_CALL_MESSAGE_TYPE] || CACHE_TTL['DEFAULT']

    try {
        await redisGuard.checkCustomLimitCounters(
            `${SERVICE_NAME}-${searchKey}`,
            appSettings?.notificationWindowSize ?? ttl,
            appSettings?.numberOfNotificationInWindow ?? DEFAULT_NOTIFICATION_WINDOW_MAX_COUNT,
            context,
        )
    } catch (err) {
        logContext.logInfoStats.step = 'check limits'
        logContext.err = err
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

async function sendMessageToUser ({ 
    context, resident, contact, user, property,
    customVoIPValuesByContactId,
    sender, dv, b2cApp: { id: b2cAppId, name: b2cAppName }, 
    callData, callStatusToken,
}) {
    const customVoIPValues = customVoIPValuesByContactId[contact.id] || {}

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
    const isB2CAppCallDataProvidedAndPreferredByCustomValue = !!callData.b2cAppCallData && customVoIPValues.voipType === B2C_APP_VOIP_TYPE
    const needToPasteB2CAppCallData = isB2CAppCallDataIsOnlyOption || isB2CAppCallDataProvidedAndPreferredByCustomValue

    if (!needToPasteB2CAppCallData) {
        let voipType = customVoIPValues.voipType || NATIVE_VOIP_TYPE
        
        const customValuePrefersB2CAppDataButHasOnlyNativeData = customVoIPValues.voipType === B2C_APP_VOIP_TYPE && !callData.b2cAppCallData
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

    const requiredMetaData = get(MESSAGE_META[VOIP_INCOMING_CALL_MESSAGE_TYPE], 'data', {})
    const metaData = Object.fromEntries(
        Object.keys(requiredMetaData).map((key) => [key, preparedDataArgs[key]])
    )

    const messageAttrs = {
        sender,
        type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
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
    logContext.logInfoStats.step = 'find property'
    logContext.logInfoStats.propertyFound = !!oldestProperty

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
    logContext.logInfoStats.step = 'find contacts'
    logContext.logInfoStats.contactsCount = allVerifiedContactsOnUnit.length

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
    logContext.logInfoStats.step = 'find residents'
    logContext.logInfoStats.residentsCount = allResidentsOnUnit.length

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

    logContext.logInfoStats.step = 'find verified residents'
    logContext.logInfoStats.contactsCount = verifiedResidentsWithContacts.length

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

async function getAppInfo ({ context, logContext, addressKey, app }) {
    const b2cAppId = app.id

    const b2cAppProperty = await B2CAppProperty.getOne(context, { 
        app: { id: b2cAppId, deletedAt: null },
        addressKey: addressKey,
        deletedAt: null,
    }, 'id app { id name }')

    if (!b2cAppProperty) {
        logContext.logInfoStats.step = 'find property'
        throw new GQLError(ERRORS.PROPERTY_NOT_FOUND, context)
    }
    logContext.logInfoStats.isPropertyFound = true
    logContext.logInfoStats.isAppFound = true

    return { b2cAppId, b2cAppName: b2cAppProperty.app.name }
}

async function getCustomVoIPValuesByContacts ({ context, contactIds }) {
    const customVoIPValues = await CustomValue.getAll(context, {
        customField: { 
            name_in: POSSIBLE_CUSTOM_FIELD_NAMES, 
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
            logContext.logInfoStats.erroredMessagesCount++
            logContext.logInfoStats.createMessageErrors.push(promiseResult.reason)
            return { error: promiseResult.reason }
        } 
        const { resident, result } = promiseResult.value

        if (result.isDuplicateMessage) {
            logContext.logInfoStats.erroredMessagesCount++
            logContext.logInfoStats.createMessageErrors.push(`${resident.id} duplicate message`)
            return { error: `${resident.id} duplicate message` }
        }
        if (result.status !== MESSAGE_SENDING_STATUS) {
            logContext.logInfoStats.erroredMessagesCount++
            logContext.logInfoStats.createMessageErrors.push(`${resident.id} invalid status for some reason`)
            return { error: `${resident.id} invalid status for some reason` }
        }
        logContext.logInfoStats.createdMessagesCount++
        return result
    })

    for (const messageStat of sendMessageStats) {
        if (messageStat.error) {
            logContext.logInfoStats.erroredMessagesCount++
            logContext.logInfoStats.createMessageErrors.push(messageStat.error)
            continue
        }
        logContext.logInfoStats.createdMessagesCount++
    }

    return sendMessageStats
}

function parseStartingMessagesIdsByUserIdsByMessageResults ({ sendMessagePromisesResults }) {
    const startingMessagesIdsByUserIds = {}
    for (const promiseResult of sendMessagePromisesResults) {
        if (promiseResult.status !== 'fulfilled') {
            continue
        }

        const { user, result } = promiseResult.value
        if (result?.id) {
            startingMessagesIdsByUserIds[user.id] = result.id
        }
    }
    
    return startingMessagesIdsByUserIds
}

function validateInput ({ context, logContext, args }) {
    logContext.logInfoStats.step = 'input validation'
    const { data: argsData } = args
    const { callData: { callId, callMeta, b2cAppCallData, nativeCallData } } = argsData
    if (!b2cAppCallData && !nativeCallData) {
        throw new GQLError(ERRORS.CALL_DATA_NOT_PROVIDED, context)
    }
                
    checkDvAndSender(argsData, ERRORS.DV_VERSION_MISMATCH, ERRORS.WRONG_SENDER_FORMAT, context)

    if (!isCallIdValid(callId)) {
        throw new GQLError(ERRORS.INVALID_CALL_ID, context)
    }

    if (!isCallMetaValid(callMeta)) {
        throw new GQLError(ERRORS.INVALID_CALL_META, context)
    }
}

const SendVoIPCallStartMessageService = new GQLCustomSchema('SendVoIPCallStartMessageService', {
    types: [
        {
            access: true,
            type: `input SendVoIPCallStartMessageVoIPPanelParameters {
                """
                Dtmf command used to open the panel
                """
                dtmfCommand: String!
                """
                Name of a panel to be displayed
                """
                name: String
                }`,
        },
        {
            access: true,
            type: `input SendVoIPCallStartMessageDataForCallHandlingByB2CApp {
                """
                Data that will be provided to B2CApp. May be stringified JSON
                """
                B2CAppContext: String!,
            }`,
        },
        {
            access: true,
            type: `input SendVoIPCallStartMessageDataForCallHandlingByNative {
                """
                Address of sip server, which device should connect to
                """
                voipAddress: String!,
                """
                Login for connection to sip server
                """
                voipLogin: String!,
                """
                Password for connection to sip server
                """
                voipPassword: String!,
                """
                Panels and their commands to open. First one must be the main one. Multiple panels are in testing stage right now and may change
                """
                voipPanels: [SendVoIPCallStartMessageVoIPPanelParameters!]!
                """
                Stun server urls. Are used to determine device public ip for media streams
                """
                stunServers: [String!],
                """
                Preferred codec (usually vp8)
                """
                codec: String
            }`,
        },
        {
            access: true,
            type: `input SendVoIPCallStartMessageData {
                """
                Unique value for each call session between panel and resident (means same for different devices also).
                Must be provided for correct work with multiple devices that use same voip call.
                F.e. to cancel calls with CANCELED_CALL_MESSAGE_PUSH messages
                """
                callId: String!,
                """
                Meta information which helps you identify call. Not used right now. Will be sent to you server on answer button press.
                """
                callMeta: JSON,
                """
                If you want your B2CApp to handle incoming VoIP call, provide this argument.
                """
                b2cAppCallData: SendVoIPCallStartMessageDataForCallHandlingByB2CApp,
                """
                If you want mobile app to handle call (without your B2CApp), provide this argument. If "b2cAppCallData" and "nativeCallData" are provided together, native call is prioritized. 
                """
                nativeCallData: SendVoIPCallStartMessageDataForCallHandlingByNative
            }`,
        },
        {
            access: true,
            type: `input SendVoIPCallStartMessageInput {
                dv: Int!,
                sender: SenderFieldInput!,
                app: B2CAppWhereUniqueInput!,
                """
                Should be "addressKey" of B2CAppProperty / Property for which you want to send message
                """
                addressKey: String!,
                """
                Name of unit, same as in Property map
                """
                unitName: String!,
                """
                Type of unit, same as in Property map
                """
                unitType: SendVoIPCallStartMessageUnitType!,
                callData: SendVoIPCallStartMessageData!
            }`,
        },
        {
            access: true,
            type: `type SendVoIPCallStartMessageOutput {
                """
                Count of all Organization Contacts, which we possibly could've sent messages to
                """
                verifiedContactsCount: Int,
                """
                Count of Messages that will be sent, one for each verified Resident
                """
                createdMessagesCount: Int,
                """
                Count of Messages which was not created due to some internal error
                """
                erroredMessagesCount: Int
            }`,
        },
        {
            access: true,
            type: `enum SendVoIPCallStartMessageUnitType { ${UNIT_TYPES.join('\n')} }`,
        },
    ],

    mutations: [
        {
            access: access.canSendVoIPCallStartMessage,
            schema: 'sendVoIPCallStartMessage(data: SendVoIPCallStartMessageInput!): SendVoIPCallStartMessageOutput',
            doc: {
                summary: 'Mutation sends VOIP_INCOMING_CALL Messages to each verified resident on address + unit. Also caches calls, so mobile app can properly react to cancel calls. ' +
                         'You can either provide all data.* arguments so mobile app will use it\'s own app to answer call, or provide just B2CAppContext + callId to use your B2CApp\'s calling app',
                errors: omit(ERRORS, 'DV_VERSION_MISMATCH', 'WRONG_SENDER_FORMAT'),
            },
            resolver: async (parent, args, context) => {
                const { data: argsData } = args
                const { dv, sender, app, addressKey, unitName, unitType, callData } = argsData

                const logContext = getInitialLogContext(argsData)

                try {
                    validateInput({ context, logContext, args })

                    // 1) Check B2CApp and B2CAppProperty
                    const { b2cAppId, b2cAppName } = await getAppInfo({ context, logContext, addressKey, app }) 

                    // 2) Get verified residents
                    const { 
                        verifiedResidentsWithContacts,
                        allVerifiedContactsOnUnit,
                        property,
                        organization,
                    } = await getVerifiedResidentsWithContacts({ context, logContext, addressKey, unitName, unitType })

                    // 3) Check limits
                    await checkLimits({ context, logContext, b2cAppId })

                    const customVoIPValuesByContactId = await getCustomVoIPValuesByContacts({ context, contactIds: [...new Set(verifiedResidentsWithContacts.map(({ contact }) => contact.id))] })
                
                    const callStatusToken = generateCallStatusToken()

                    // 4) Send messages
                    /** @type {Array<Promise<{status, id, isDuplicateMessage}>>} */
                    const sendMessagePromises = verifiedResidentsWithContacts
                        .map(({ resident, contact, user }) => {
                            return sendMessageToUser({ 
                                context, resident, contact, user, property, customVoIPValuesByContactId,
                                dv, sender, callData, b2cApp: { id: b2cAppId, name: b2cAppName },
                                callStatusToken,
                            })
                        })
                
                    // 5) Set call status in redis
                    logContext.logInfoStats.step = 'send messages'
                    const sendMessageResults = await Promise.allSettled(sendMessagePromises)
                    const sendMessageStats = parseSendMessageResults({ sendMessagePromisesResults: sendMessageResults, logContext })
                    const startingMessagesIdsByUserIds = parseStartingMessagesIdsByUserIdsByMessageResults({ sendMessagePromisesResults: sendMessageResults })

                    if (sendMessageStats.some(stat => !stat.error)) {
                        logContext.logInfoStats.isStatusCached = await setCallStatus({
                            callStatusToken,
                            b2cAppId,
                            propertyId: property.id,
                            organizationId: organization.id,
                            callId: callData.callId,
                            status: CALL_STATUS_STARTED,
                            // NOTE(YEgorLu): we can use uniqKey for that: [pushType, b2cAppId, callId, userId, YYYY-MM-DD].join()
                            //                but this would require to check current and previous day/period
                            //                for now lets save it in session, usually we receive cancel message in less than 1 minute anyway
                            startingMessagesIdsByUserIds: startingMessagesIdsByUserIds, // check uniqKey
                            callMeta: callData.callMeta,
                        })
                    }

                    logContext.logInfoStats.step = 'result'
                    logInfo(logContext)

                    return {
                        verifiedContactsCount: allVerifiedContactsOnUnit.length,
                        createdMessagesCount: sendMessageStats.filter(stat => !stat.error).length,
                        erroredMessagesCount: sendMessageStats.filter(stat => !!stat.error).length,
                    }
                } catch (err) {
                    logInfo(logContext)
                    if (err instanceof RejectCallError) {
                        return err.returnData
                    }
                    throw err
                }
            },
        },
    ],

})

module.exports = {
    SendVoIPCallStartMessageService,
    ERRORS,
    CACHE_TTL,
}
