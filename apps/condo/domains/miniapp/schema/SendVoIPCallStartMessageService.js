const omit = require('lodash/omit')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { getLogger } = require('@open-condo/keystone/logging')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const { COMMON_ERRORS } = require('@condo/domains/common/constants/errors')
const access = require('@condo/domains/miniapp/access/SendVoIPCallStartMessageService')
const {
    PROPERTY_NOT_FOUND_ERROR,
    CALL_DATA_NOT_PROVIDED_ERROR,
    INVALID_CALL_ID_ERROR,
    INVALID_CALL_META_ERROR,
} = require('@condo/domains/miniapp/constants')
const {
    RejectCallError,
    checkLimits,
    getAppInfo,
    getCustomVoIPValuesByContacts,
    getInitialLogContext,
    getLogInfoFn,
    getVerifiedResidentsWithContacts,
    parseSendMessageResults,
    sendMessageToUser,
} = require('@condo/domains/miniapp/utils/sendVoIPCallMessage')
const { setCallStatus, generateCallStatusToken, isCallIdValid, CALL_STATUS_STARTED, MIN_CALL_ID_LENGTH, MAX_CALL_ID_LENGTH, MAX_CALL_META_LENGTH, isCallMetaValid } = require('@condo/domains/miniapp/utils/voip')
const { VOIP_INCOMING_CALL_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { UNIT_TYPES } = require('@condo/domains/property/constants/common')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

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
        variable: ['data', 'callData'],
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

const logInfo = getLogInfoFn({ logger, serviceName: SERVICE_NAME })

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
                    const { b2cAppId, b2cAppName } = await getAppInfo({ propertyNotFoundError: ERRORS.PROPERTY_NOT_FOUND, context, logContext, addressKey, app }) 

                    // 2) Get verified residents
                    const { 
                        verifiedResidentsWithContacts,
                        allVerifiedContactsOnUnit,
                        property,
                        organization,
                    } = await getVerifiedResidentsWithContacts({ context, logContext, addressKey, unitName, unitType })

                    // 3) Check limits
                    await checkLimits({ redisGuard, serviceName: SERVICE_NAME, voipMessageType: VOIP_INCOMING_CALL_MESSAGE_TYPE, context, logContext, b2cAppId, addressKey, unitName, unitType })

                    const customVoIPValuesByContactId = await getCustomVoIPValuesByContacts({ voipMessageType: VOIP_INCOMING_CALL_MESSAGE_TYPE, context, contactIds: [...new Set(verifiedResidentsWithContacts.map(({ contact }) => contact.id))] })
                
                    const callStatusToken = generateCallStatusToken()

                    // 4) Send messages
                    /** @type {Array<Promise<{status, id, isDuplicateMessage}>>} */
                    const sendMessagePromises = verifiedResidentsWithContacts
                        .map(({ resident, contact, user }) => {
                            return sendMessageToUser({ 
                                voipMessageType: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                                context, resident, contact, user, property, customVoIPValues: customVoIPValuesByContactId[contact.id],
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
}
