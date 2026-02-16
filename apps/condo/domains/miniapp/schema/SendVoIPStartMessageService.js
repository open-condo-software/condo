const get = require('lodash/get')
const omit = require('lodash/omit')

const conf = require('@open-condo/config')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { getLogger } = require('@open-condo/keystone/logging')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { GQLCustomSchema, find, getByCondition } = require('@open-condo/keystone/schema')
const { i18n } = require('@open-condo/locales/loader')

const { COMMON_ERRORS } = require('@condo/domains/common/constants/errors')
const access = require('@condo/domains/miniapp/access/SendVoIPStartMessageService')
const {
    PROPERTY_NOT_FOUND_ERROR,
    APP_NOT_FOUND_ERROR,
    DEFAULT_NOTIFICATION_WINDOW_MAX_COUNT,
    DEFAULT_NOTIFICATION_WINDOW_DURATION_IN_SECONDS,
} = require('@condo/domains/miniapp/constants')
const { B2CAppProperty } = require('@condo/domains/miniapp/utils/serverSchema')
const { setCallStatus, CALL_STATUS_START_SENT } = require('@condo/domains/miniapp/utils/voip')
const {
    MESSAGE_META,
    VOIP_INCOMING_CALL_MESSAGE_TYPE, MESSAGE_SENDING_STATUS,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { FLAT_UNIT_TYPE, APARTMENT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { RESIDENT } = require('@condo/domains/user/constants/common')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const CACHE_TTL = {
    DEFAULT: DEFAULT_NOTIFICATION_WINDOW_DURATION_IN_SECONDS,
    [VOIP_INCOMING_CALL_MESSAGE_TYPE]: 2,
}

/**
 * If debug app is set and debug app settings are configured, then user can send push messages without creating B2CApp first.
 * This is useful for testing and development, but it should be turned off on production
 */
const DEBUG_APP_ID = conf.MINIAPP_PUSH_MESSAGE_DEBUG_APP_ID
const DEBUG_APP_ENABLED = !!DEBUG_APP_ID
const DEBUG_APP_SETTINGS = DEBUG_APP_ENABLED ? Object.freeze(JSON.parse(conf.MINIAPP_PUSH_MESSAGE_DEBUG_APP_SETTINGS)) : {}
const ALLOWED_UNIT_TYPES = [FLAT_UNIT_TYPE, APARTMENT_UNIT_TYPE]

const redisGuard = new RedisGuard()

const logger = getLogger()

const SERVICE_NAME = 'sendVoIPStartMessage'
const ERRORS = {
    PROPERTY_NOT_FOUND: {
        query: SERVICE_NAME,
        variable: ['data', 'addressKey'],
        code: BAD_USER_INPUT,
        type: PROPERTY_NOT_FOUND_ERROR,
        message: 'Unable to find Property or B2CAppProperty by provided addressKey',
        messageForUser: `api.miniapp.${SERVICE_NAME}.PROPERTY_NOT_FOUND`,
    },
    APP_NOT_FOUND: {
        mutation: SERVICE_NAME,
        variable: ['data', 'addressKey'],
        code: BAD_USER_INPUT,
        type: APP_NOT_FOUND_ERROR,
        message: 'Unable to find B2CApp.',
        messageForUser: `api.miniapp.${SERVICE_NAME}.APP_NOT_FOUND`,
    },
    DV_VERSION_MISMATCH: {
        ...COMMON_ERRORS.DV_VERSION_MISMATCH,
        mutation: SERVICE_NAME,
    },
    WRONG_SENDER_FORMAT: {
        ...COMMON_ERRORS.WRONG_SENDER_FORMAT,
        mutation: SERVICE_NAME,
    },
}

const logInfo = ({ b2cAppId, callId, stats, errors }) => {
    logger.info({ msg: `${SERVICE_NAME} stats`, entityName: 'B2CApp', entityId: b2cAppId, data: { callId, stats }, err: errors })
}

const SendVoIPStartMessageService = new GQLCustomSchema('SendVoIPStartMessageService', {
    types: [
        {
            access: true,
            type: 'enum VoIPType {' +
                    '"""' +
                    'Makes mobile app use it\'s call app instead of B2CApp\'s' +
                    '"""' +
                    'sip' +
                '}',
        },
        {
            access: true,
            type: 'input VoIPPanel {' +
                '"""' +
                'Dtfm command for panel' +
                '"""' +
                'dtfmCommand: String!' +
                '"""' +
                'Name of a panel to be displayed' +
                '"""' +
                'name: String!' +
                '}',
        },
        {
            access: true,
            type: 'input SendVoIPStartMessageData { ' +
                '"""' +
                'If you want your B2CApp to handle incoming VoIP call, provide this argument. Otherwise provide all others' +
                '"""' +
                'B2CAppContext: String, ' +
                '"""' +
                'Unique value for each call session between panel and resident (means same for different devices also). ' +
                'Must be provided for correct work with multiple devices that use same voip call.' +
                'F.e. to cancel calls with CANCELED_CALL_MESSAGE_PUSH messages' +
                '"""' +
                'callId: String!, ' +
                '"""' +
                'If "sip" was passed, mobile device will try to start native call. Info about other values will be added later' +
                '"""' +
                'voipType: VoIPType, ' +
                '"""' +
                'Address of sip server, which device should connect to' +
                '"""' +
                'voipAddress: String, ' +
                '"""' +
                'Login for connection to sip server' +
                '"""' +
                'voipLogin: String, ' +
                '"""' +
                'Password for connection to sip server' +
                '"""' +
                'voipPassword: String, ' +
                '"""' +
                'Panels and their commands to open. First one must be the main one. Multiple panels are in testing stage right now and may change' +
                '"""' +
                'voipPanels: [VoIPPanel]' +
                '"""' +
                'Stun server url' +
                '"""' +
                'stun: String, ' +
                '"""' +
                'Preferred codec (usually vp8)' +
                '"""' +
                'codec: String ' +
                '}',
        },
        {
            access: true,
            type: 'input SendVoIPStartMessageInput { ' +
                'dv: Int!, ' +
                'sender: SenderFieldInput!, ' +
                'app: B2CAppWhereUniqueInput!, ' +
                '"""' +
                'Should be "addressKey" of B2CAppProperty / Property for which you want to send message' +
                '"""' +
                'addressKey: String!, ' +
                '"""' +
                'Name of unit, same as in Property map' +
                '"""' +
                'unitName: String!, ' +
                '"""' +
                'Type of unit, same as in Property map' +
                '"""' +
                'unitType: AllowedVoIPMessageUnitType!, ' +
                'data: SendVoIPStartMessageData! ' +
                '}',
        },
        {
            access: true,
            type: 'type SendVoIPStartMessageOutput { ' +
                '"""' +
                'Count of all Organization Contacts, which we possibly could\'ve sent messages to' +
                '"""' +
                'verifiedContactsCount: Int, ' +
                '"""' +
                'Count of Messages that will be sent, one for each verified Resident' +
                '"""' +
                'createdMessagesCount: Int,' +
                '"""' +
                'Count of Messages which was not created due to some internal error' +
                '"""' +
                'erroredMessagesCount: Int' +
                '}',
        },
        {
            access: true,
            type: `enum AllowedVoIPMessageUnitType { ${ALLOWED_UNIT_TYPES.join('\n')} }`,
        },
    ],

    mutations: [
        {
            access: access.canSendVoIPStartMessage,
            schema: 'sendVoIPStartMessage(data: SendVoIPStartMessageInput!): SendVoIPStartMessageOutput',
            doc: {
                summary: 'Mutation sends VOIP_INCOMING_CALL Messages to each verified resident on address + unit. Also caches calls, so mobile app can properly react to cancel calls. ' +
                         'You can either provide all data.* arguments so mobile app will use it\'s own app to answer call, or provide just B2CAppContext + callId to use your B2CApp\'s calling app',
                errors: omit(ERRORS, 'DV_VERSION_MISMATCH', 'WRONG_SENDER_FORMAT'),
            },
            resolver: async (parent, args, context) => {
                const { data: argsData } = args
                const { dv, sender, app, addressKey, unitName, unitType, data } = argsData
                
                checkDvAndSender(argsData, ERRORS.DV_VERSION_MISMATCH, ERRORS.WRONG_SENDER_FORMAT, context)

                const logInfoStats = {
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
                }

                // 1) Check B2CApp and B2CAppProperty
                const b2cAppId = app.id

                const [b2cAppProperty] = await B2CAppProperty.getAll(context, { 
                    app: { id: b2cAppId, deletedAt: null },
                    addressKey: addressKey,
                    deletedAt: null,
                }, 'id app { id name }', { first: 1 })

                if (!b2cAppProperty) {
                    logInfo({ b2cAppId, callId: data.callId, stats: logInfoStats })
                    throw new GQLError(ERRORS.PROPERTY_NOT_FOUND, context)
                }
                logInfoStats.isPropertyFound = true
                
                if (!b2cAppProperty.app) {
                    logInfo({ b2cAppId, callId: data.callId, stats: logInfoStats })
                    throw new GQLError(ERRORS.APP_NOT_FOUND, context)
                }
                logInfoStats.isAppFound = true
                
                const b2cAppName = b2cAppProperty.app.name
                
                // 2) Find Users
                const verifiedContactsOnUnit = await find('Contact', {
                    property: { addressKey: addressKey, deletedAt: null },
                    unitName_i: unitName,
                    unitType: unitType,
                    isVerified: true,
                    deletedAt: null,
                })
                logInfoStats.step = 'find verified contacts'
                logInfoStats.verifiedContactsCount = verifiedContactsOnUnit.length

                if (!verifiedContactsOnUnit?.length) {
                    logInfo({ b2cAppId, callId: data.callId, stats: logInfoStats })
                    return {
                        verifiedContactsCount: 0,
                        createdMessagesCount: 0,
                        erroredMessagesCount: 0,
                    }
                }
                
                const residentsOnUnit = await find('Resident', {
                    unitName_i: unitName,
                    unitType: unitType,
                    deletedAt: null,
                    property: { id_in: [...new Set(verifiedContactsOnUnit.map(contact => contact.property))] },
                })
                logInfoStats.step = 'find residents'
                logInfoStats.residentsCount = residentsOnUnit.length

                // NOTE(YEgorLu): doing same as Resident.isVerifiedByManagingCompany virtual field
                const usersOfContacts = await find('User', {
                    phone_in: [...new Set(verifiedContactsOnUnit.map(contact => contact.phone))],
                    deletedAt: null,
                    type: RESIDENT,
                    isPhoneVerified: true,
                })

                const uniqueUserIdsOfContacts = new Set(usersOfContacts.map(user => user.id))
                const residentsWithVerifiedContactOnAddress = residentsOnUnit.filter(resident => uniqueUserIdsOfContacts.has(resident.user))
                logInfoStats.step = 'verify residents'
                logInfoStats.verifiedResidentsCount = residentsWithVerifiedContactOnAddress.length

                if (!residentsWithVerifiedContactOnAddress?.length) {
                    logInfo({ b2cAppId, callId: data.callId, stats: logInfoStats })
                    return {
                        verifiedContactsCount: verifiedContactsOnUnit.length,
                        createdMessagesCount: 0,
                        erroredMessagesCount: 0,
                    }
                }

                const userIdToLocale = {}
                usersOfContacts.forEach(user => userIdToLocale[user.id] = user.locale)

                // NOTE(YEgorLu): there should be maximum 1 Resident for user + address + unitName + unitType, but just in case lets deduplicate
                const residentsGroupedByUser = residentsWithVerifiedContactOnAddress.reduce((groupedByUser, resident) => {
                    groupedByUser[resident.user] = resident
                    return groupedByUser
                }, {})
                const verifiedResidentsWithUniqueUsers = Object.values(residentsGroupedByUser)

                let appSettings

                if (!DEBUG_APP_ENABLED || b2cAppId !== DEBUG_APP_ID) {
                    appSettings = await getByCondition('AppMessageSetting', {
                        b2cApp: { id: b2cAppId }, type: VOIP_INCOMING_CALL_MESSAGE_TYPE, deletedAt: null, 
                    })
                }

                else {
                    appSettings = { ...DEBUG_APP_SETTINGS }
                }

                // 3) Create Messages

                const searchKey = `${VOIP_INCOMING_CALL_MESSAGE_TYPE}-${b2cAppId}`
                const ttl = CACHE_TTL[VOIP_INCOMING_CALL_MESSAGE_TYPE] || CACHE_TTL['DEFAULT']

                try {
                    await redisGuard.checkCustomLimitCounters(
                        `${SERVICE_NAME}-${searchKey}`,
                        get(appSettings, 'notificationWindowSize') ?? ttl,
                        get(appSettings, 'numberOfNotificationInWindow') ?? DEFAULT_NOTIFICATION_WINDOW_MAX_COUNT,
                        context,
                    )
                } catch (err) {
                    logInfoStats.step = 'check limits'
                    logInfo({ b2cAppId, callId: data.callId, stats: logInfoStats, errors: err })
                    throw err
                }

                const startingMessagesIdsByUserIds = {}

                /** @type {Array<Promise<{status, id, isDuplicateMessage}>>} */
                const sendMessagePromises = verifiedResidentsWithUniqueUsers
                    // .filter(resident => !rateLimitsErrorsByUserIds[resident.user])
                    .map(async (resident) => {
                        // NOTE(YEgorLu): as in domains/notification/constants/config for VOIP_INCOMING_CALL_MESSAGE_TYPE
                        const preparedDataArgs = {
                            B2CAppId: b2cAppId,
                            B2CAppContext: data.B2CAppContext,
                            B2CAppName: b2cAppName,
                            residentId: resident.id,
                            callId: data.callId,
                            voipType: data.voipType,
                            voipAddress: data.voipAddress,
                            voipLogin: data.voipLogin,
                            voipPassword: data.voipPassword,
                            voipDtfmCommand: data.voipPanels?.[0]?.dtfmCommand,
                            voipPanels: data.voipPanels,
                            stun: data.stun,
                            codec: data.codec,
                        }

                        const requiredMetaData = get(MESSAGE_META[VOIP_INCOMING_CALL_MESSAGE_TYPE], 'data', {})
                        const metaData = Object.fromEntries(
                            Object.keys(requiredMetaData).map((key) => [key, preparedDataArgs[key]])
                        )

                        const messageAttrs = {
                            sender,
                            type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                            to: { user: { id: resident.user } },
                            meta: {
                                dv,
                                title: i18n('api.miniapp.sendVoIPStartMessage.pushData.title', { locale: userIdToLocale[resident.user] }),
                                body: i18n('api.miniapp.sendVoIPStartMessage.pushData.body', { locale: userIdToLocale[resident.user] }),
                                data: metaData,
                            },
                        }

                        const res = await sendMessage(context, messageAttrs)
                        if (res?.id) {
                            startingMessagesIdsByUserIds[resident.user] = res.id
                        }
                        return { resident, result: res }
                    })
                
                // 4) Set status in redis

                logInfoStats.step = 'send messages'
                const sendMessageResults = await Promise.allSettled(sendMessagePromises)
                const sendMessageStats = sendMessageResults.map(promiseResult => {
                    if (promiseResult.status === 'rejected') {
                        logInfoStats.erroredMessagesCount++
                        logInfoStats.createMessageErrors.push(promiseResult.reason)
                        return { error: promiseResult.reason }
                    } 
                    const { resident, result } = promiseResult.value
                    if (result.isDuplicateMessage) {
                        logInfoStats.erroredMessagesCount++
                        logInfoStats.createMessageErrors.push(`${resident.id} duplicate message`)
                        return { error: `${resident.id} duplicate message` }
                    }
                    if (result.status !== MESSAGE_SENDING_STATUS) {
                        logInfoStats.erroredMessagesCount++
                        logInfoStats.createMessageErrors.push(`${resident.id} invalid status for some reason`)
                        return { error: `${resident.id} invalid status for some reason` }
                    }
                    logInfoStats.createdMessagesCount++
                    return result
                })
                
                for (const messageStat of sendMessageStats) {
                    if (messageStat.error) {
                        logInfoStats.erroredMessagesCount++
                        logInfoStats.createMessageErrors.push(messageStat.error)
                        continue
                    }
                    logInfoStats.createdMessagesCount++
                }

                if (sendMessageStats.some(stat => !stat.error)) {
                    logInfoStats.isStatusCached = await setCallStatus({
                        b2cAppId,
                        callId: data.callId,
                        status: CALL_STATUS_START_SENT,
                        // NOTE(YEgorLu): we can use uniqKey for that: [pushType, b2cAppId, callId, userId, YYYY-MM-DD].join()
                        //                but this would require to check current and previous day/period
                        //                for now lets save it in session, usually we receive cancel message in less than 1 minute anyway
                        startingMessagesIdsByUserIds: startingMessagesIdsByUserIds, // check uniqKey
                    })
                }

                logInfoStats.step = 'result'
                logInfo({ b2cAppId, callId: data.callId, stats: logInfoStats })

                return {
                    verifiedContactsCount: verifiedContactsOnUnit.length,
                    createdMessagesCount: sendMessageStats.filter(stat => !stat.error).length,
                    erroredMessagesCount: sendMessageStats.filter(stat => !!stat.error).length,
                }
            },
        },
    ],

})

module.exports = {
    SendVoIPStartMessageService,
    ERRORS,
    CACHE_TTL,
}
