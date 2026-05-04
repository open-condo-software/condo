const omit = require('lodash/omit')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { getLogger } = require('@open-condo/keystone/logging')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const { COMMON_ERRORS } = require('@condo/domains/common/constants/errors')
const access = require('@condo/domains/miniapp/access/SendVoIPCallCancelMessageService')
const {
    PROPERTY_NOT_FOUND_ERROR,
    INVALID_CALL_ID_ERROR,
} = require('@condo/domains/miniapp/constants')
const { 
    getAppInfo, 
    getVerifiedResidentsWithContacts, 
    parseSendMessageResults, 
    sendMessageToUser,
    RejectCallError,
    checkLimits,
    getInitialLogContext,
    getLogInfoFn,
} = require('@condo/domains/miniapp/utils/sendVoIPCallMessage')
const { setCallStatus, isCallIdValid, CALL_STATUS_STARTED, MIN_CALL_ID_LENGTH, MAX_CALL_ID_LENGTH, getCallStatus, CALL_STATUS_ANSWERED, CALL_STATUS_ENDED } = require('@condo/domains/miniapp/utils/voip')
const { CANCELED_CALL_MESSAGE_PUSH_TYPE } = require('@condo/domains/notification/constants/constants')
const { UNIT_TYPES } = require('@condo/domains/property/constants/common')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const redisGuard = new RedisGuard()

const logger = getLogger()

const SERVICE_NAME = 'sendVoIPCallCancelMessage'
const ERRORS = {
    PROPERTY_NOT_FOUND: {
        mutation: SERVICE_NAME,
        variable: ['data', 'addressKey'],
        code: BAD_USER_INPUT,
        type: PROPERTY_NOT_FOUND_ERROR,
        message: 'Unable to find Property or B2CAppProperty by provided addressKey',
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
}

const logInfo = getLogInfoFn({ logger, serviceName: SERVICE_NAME })

function validateInput ({ context, logContext, args }) {
    logContext.logInfoStats.step = 'input validation'
    const { data: argsData } = args
    const { callData: { callId } } = argsData
                
    checkDvAndSender(argsData, ERRORS.DV_VERSION_MISMATCH, ERRORS.WRONG_SENDER_FORMAT, context)

    if (!isCallIdValid(callId)) {
        throw new GQLError(ERRORS.INVALID_CALL_ID, context)
    }
}

const SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ANSWERED = 'answered'
const SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED = 'ended'

const CANCEL_REASON_TO_CALL_STATUS = {
    [SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED]: CALL_STATUS_ENDED,
    [SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ANSWERED]: CALL_STATUS_ANSWERED,
}

const SendVoIPCallCancelMessageService = new GQLCustomSchema('SendVoIPCallCancelMessageService', {
    types: [
        {
            access: true,
            type: `enum SendVoIPCallCancelMessageCancelReason {
                """
                Call was answered on one of the devices, so call session is still active
                """
                ${SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ANSWERED}
                """
                Whole call was already ended
                """
                ${SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED}
                }`,
        },
        {
            access: true,
            type: `input SendVoIPCallCancelMessageData {
                """
                Unique value for each call session between panel and resident (means same for different devices also).
                Must be provided for correct work with multiple devices that use same voip call.
                F.e. to cancel calls with CANCELED_CALL_MESSAGE_PUSH messages
                """
                callId: String!,
                """
                Reason why call was canceled
                """
                reason: SendVoIPCallCancelMessageCancelReason!
            }`,
        },
        {
            access: true,
            type: `input SendVoIPCallCancelMessageInput {
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
                unitType: SendVoIPCallCancelMessageUnitType!,
                callData: SendVoIPCallCancelMessageData!
            }`,
        },
        {
            access: true,
            type: `type SendVoIPCallCancelMessageOutput {
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
            type: `enum SendVoIPCallCancelMessageUnitType { ${UNIT_TYPES.join('\n')} }`,
        },
    ],

    mutations: [
        {
            access: access.canSendVoIPCallCancelMessage,
            schema: 'sendVoIPCallCancelMessage(data: SendVoIPCallCancelMessageInput!): SendVoIPCallCancelMessageOutput',
            doc: {
                summary: 'Mutation sends CANCELED_CALL_MESSAGE Messages to each verified resident on address + unit. This push rejects incoming calls, if they werent answered yet.',
                errors: omit(ERRORS, 'DV_VERSION_MISMATCH', 'WRONG_SENDER_FORMAT'),
            },
            resolver: async (parent, args, context) => {
                const { data: argsData } = args
                const { dv, sender, app, addressKey, unitName, unitType, callData } = argsData

                const logContext = getInitialLogContext(argsData)

                try {
                    validateInput({ context, logContext, args })

                    // 1) Check B2CApp and B2CAppProperty
                    const { b2cAppId, b2cAppName } = await getAppInfo({ context, propertyNotFoundError: ERRORS.PROPERTY_NOT_FOUND, logContext, addressKey, app }) 

                    // 2) Get verified residents
                    const { 
                        verifiedResidentsWithContacts,
                        allVerifiedContactsOnUnit,
                        property,
                        organization,
                    } = await getVerifiedResidentsWithContacts({ context, logContext, addressKey, unitName, unitType })

                    // 3) Check limits
                    await checkLimits({ context, logContext, b2cAppId, addressKey, unitName, unitType, redisGuard, serviceName: SERVICE_NAME, voipMessageType: CANCELED_CALL_MESSAGE_PUSH_TYPE })
                
                    const callStatus = await getCallStatus({ b2cAppId, callId: callData.callId, organizationId: organization.id, propertyId: property.id })

                    if (!callStatus || callStatus.status !== CALL_STATUS_STARTED) {
                        logContext.logInfoStats.step = 'call status not found'
                        logInfo(logContext)
                        return {
                            verifiedContactsCount: allVerifiedContactsOnUnit.length,
                            createdMessagesCount: 0,
                            erroredMessagesCount: verifiedResidentsWithContacts.length,
                        }
                    }

                    // 4) Send messages
                    /** @type {Array<Promise<{status, id, isDuplicateMessage}>>} */
                    const sendMessagePromises = verifiedResidentsWithContacts
                        .map(({ resident, contact, user }) => {
                            return sendMessageToUser({
                                voipMessageType: CANCELED_CALL_MESSAGE_PUSH_TYPE,
                                context, resident, contact, user, property,
                                dv, sender, callData, b2cApp: { id: b2cAppId, name: b2cAppName },
                                voipIncomingCallId: callStatus.startingMessagesIdsByUserIds[user.id],
                            })
                        })
                
                    // 5) Set call status in redis
                    logContext.logInfoStats.step = 'send messages'
                    const sendMessageResults = await Promise.allSettled(sendMessagePromises)
                    const sendMessageStats = parseSendMessageResults({ sendMessagePromisesResults: sendMessageResults, logContext })

                    if (sendMessageStats.some(stat => !stat.error)) {
                        logContext.logInfoStats.isStatusCached = await setCallStatus({
                            ...callStatus,
                            b2cAppId,
                            propertyId: property.id,
                            organizationId: organization.id,
                            callId: callData.callId,
                            status: CANCEL_REASON_TO_CALL_STATUS[callData.reason],
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
    SendVoIPCallCancelMessageService,
    ERRORS,
}
