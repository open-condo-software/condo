const get = require('lodash/get')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { getLogger } = require('@open-condo/keystone/logging')
const { GQLCustomSchema, getByCondition, find } = require('@open-condo/keystone/schema')

const { REQUIRED, UNKNOWN_ATTRIBUTE, WRONG_VALUE, DV_VERSION_MISMATCH } = require('@condo/domains/common/constants/errors')
const { LOCALES } = require('@condo/domains/common/constants/locale')
const access = require('@condo/domains/notification/access/SendMessageService')
const {
    MESSAGE_TYPES,
    MESSAGE_META,
    MESSAGE_SENDING_STATUS,
    MESSAGE_RESENDING_STATUS,
    MESSAGE_DELIVERY_OPTIONS,
    MESSAGE_DELIVERY_DEFAULT_PRIORITY,
    MESSAGE_DELIVERY_PRIORITY_TO_TASK_QUEUE_MAP,
    MESSAGE_DISABLED_BY_USER_STATUS,
    DEFAULT_MESSAGE_DELIVERY_OPTIONS,
} = require('@condo/domains/notification/constants/constants')
const { MESSAGE_FIELDS } = require('@condo/domains/notification/gql')
const { deliverMessage } = require('@condo/domains/notification/tasks')
const { Message } = require('@condo/domains/notification/utils/serverSchema')

const logger = getLogger()

const ERRORS = {
    EMAIL_FROM_REQUIRED: {
        mutation: 'sendMessage',
        variable: ['data', 'to', 'email'],
        code: BAD_USER_INPUT,
        type: REQUIRED,
        message: 'You can not use emailFrom without to.email',
    },
    USER_OR_EMAIL_OR_PHONE_OR_REMOTE_CLIENT_REQUIRED: {
        mutation: 'sendMessage',
        variable: ['data'],
        code: BAD_USER_INPUT,
        type: REQUIRED,
        message: 'You should provide either "user", "email", "phone" or "remoteClient" attribute',
    },
    UNKNOWN_META_ATTRIBUTE: {
        mutation: 'sendMessage',
        variable: ['data', 'meta'],
        code: BAD_USER_INPUT,
        type: UNKNOWN_ATTRIBUTE,
        message: 'Unknown attribute "{attr}" provided to "meta" variable',
        messageInterpolation: { attr: '<attr-name>' },
    },
    MISSING_VALUE_FOR_REQUIRED_META_ATTRIBUTE: {
        mutation: 'sendMessage',
        variable: ['data', 'meta'],
        code: BAD_USER_INPUT,
        type: REQUIRED,
        message: 'Missing value for required "meta.{attr}" attribute',
        messageInterpolation: { attr: '<name>' },
    },
    UNKNOWN_MESSAGE_TYPE: {
        mutation: 'sendMessage',
        variable: ['data', 'meta'],
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        message: 'Unknown value "{type}" provided for message type',
        messageInterpolation: { type: '<type-name>' },
    },
    DV_VERSION_MISMATCH: {
        mutation: 'sendMessage',
        variable: ['data', 'meta', 'dv'],
        code: BAD_USER_INPUT,
        type: DV_VERSION_MISMATCH,
        message: 'Wrong value for data version number',
    },
}

async function checkSendMessageMeta (type, meta, context) {
    if (meta.dv !== 1) throw new GQLError(ERRORS.DV_VERSION_MISMATCH, context)
    const schema = MESSAGE_META[type]
    if (!schema) {
        throw new GQLError({ ...ERRORS.UNKNOWN_MESSAGE_TYPE, messageInterpolation: { type } }, context)
    }
    for (const attr of Object.keys(schema)) {
        const value = meta[attr]
        const { required } = schema[attr]
        if (required && (value === undefined || value === null)) {
            throw new GQLError({ ...ERRORS.MISSING_VALUE_FOR_REQUIRED_META_ATTRIBUTE, messageInterpolation: { attr } }, context)
        }

        if (attr === 'data' && typeof value === 'object' && schema.data) {
            const dataSchema = schema.data
            // In some MESSAGE_META[type] we have "date" fields of the following type - data: { defaultValue: null, required: true }
            // We don't need to check these fields, since they are service fields and their values are not objects
            const serviceFields = [
                'required',
                'defaultValue',
            ]

            for (const dataAttr of Object.keys(dataSchema)) {
                if (serviceFields.includes(dataAttr)) continue

                const { required: dataRequired } = dataSchema[dataAttr]
                if (dataRequired && (value[dataAttr] === undefined || value[dataAttr] === null)) {
                    logger.info({ msg: 'missing value for required "meta"', data: { dataAttr, type } })
                }
            }

            for (const dataAttr of Object.keys(value)) {
                if (!dataSchema[dataAttr]) {
                    logger.info({ msg: 'unknown attribute provided to "meta" variable', data: { dataAttr, type } })
                }
            }
        }
    }

    for (const attr of Object.keys(meta)) {
        if (!schema[attr]) {
            throw new GQLError({ ...ERRORS.UNKNOWN_META_ATTRIBUTE, messageInterpolation: { attr } }, context)
        }
    }
}

/**
 * Gets condo tasks queue on which to start message delivery
 * @param {string} type Message type
 * @returns {'medium' | 'high' | 'low'} condo task queue
 */
function getMessageQueue ({ type }) {
    // TODO(VKislov): DOMA-7915 separate queue for VoIP here?
    const defaultQueue = MESSAGE_DELIVERY_PRIORITY_TO_TASK_QUEUE_MAP[MESSAGE_DELIVERY_DEFAULT_PRIORITY]
    const messagePriority = get(MESSAGE_DELIVERY_OPTIONS, [type, 'priority'], MESSAGE_DELIVERY_DEFAULT_PRIORITY)

    return get(MESSAGE_DELIVERY_PRIORITY_TO_TASK_QUEUE_MAP, messagePriority, defaultQueue)
}

const SendMessageService = new GQLCustomSchema('SendMessageService', {
    types: [
        {
            access: true,
            type: `enum SendMessageLang { ${Object.keys(LOCALES).join(' ')} }`,
        },
        {
            access: true,
            type: 'input SendMessageToInput { user: UserWhereUniqueInput, email: String, phone: String, remoteClient: RemoteClientWhereInput }',
        },
        {
            access: true,
            type: `enum MessageType { ${MESSAGE_TYPES.join(' ')} }`,
        },
        {
            access: true,
            type: 'input SendMessageInput { dv: Int!, sender: SenderFieldInput!, to: SendMessageToInput!, emailFrom: String, type: MessageType!, lang: SendMessageLang!, meta: JSON!, organization: OrganizationWhereUniqueInput, uniqKey: String }',
        },
        {
            access: true,
            type: 'type SendMessageOutput { status: String!, id: String, isDuplicateMessage: Boolean }',
        },
        {
            access: true,
            type: 'input ResendMessageInput { dv: Int!, sender: SenderFieldInput!, message: MessageWhereUniqueInput! }',
        },
        {
            access: true,
            type: 'type ResendMessageOutput { status: String!, id: String! }',
        },
    ],
    mutations: [
        {
            access: access.canSendMessage,
            schema: 'sendMessage(data: SendMessageInput!): SendMessageOutput',
            doc: {
                summary: 'Sends message of specified type to specified contact',
                description: `Each message type has specific set of required fields: \n\n\`${JSON.stringify(MESSAGE_META, null, '\t')}\``,
                errors: ERRORS,
            },
            resolver: async (parent, args, context) => {
                // TODO(pahaz): think about sending emails with attachments
                const { data } = args
                const { dv, sender, to, emailFrom, type, meta, lang, uniqKey, organization } = data

                if (!to.user && !to.email && !to.phone && !to.remoteClient) throw new GQLError(ERRORS.USER_OR_EMAIL_OR_PHONE_OR_REMOTE_CLIENT_REQUIRED, context)
                if (emailFrom && !to.email) throw new GQLError(ERRORS.EMAIL_FROM_REQUIRED, context)

                await checkSendMessageMeta(type, meta, context)

                const messageAttrs = { dv, sender, status: MESSAGE_SENDING_STATUS, type, meta, lang, emailFrom, uniqKey }

                if (organization) {
                    messageAttrs['organization'] = { connect: organization }
                }

                // TODO(pahaz): add email/phone validation
                if (to.email) messageAttrs.email = to.email
                if (to.phone) messageAttrs.phone = to.phone
                if (to.user) messageAttrs.user = { connect: to.user }
                if (to.remoteClient) messageAttrs.remoteClient = { connect: to.remoteClient }

                // NOTE: Check user notification settings before creating Message.
                // We don't create Message if user has disabled this notification type for all transports.
                // This prevents creating unnecessary Message objects that won't be delivered anyway.
                // Settings priority: user-specific settings override global settings (where user is null).
                if (to.user) {
                    const messageTransports = MESSAGE_DELIVERY_OPTIONS[type]?.defaultTransports ?? DEFAULT_MESSAGE_DELIVERY_OPTIONS.defaultTransports
                    const messageSettings = await find('NotificationUserSetting', {
                        OR: [
                            { user: to.user },
                            { user_is_null: true },
                        ],
                        messageTransport_in: messageTransports,
                        messageType: type,
                        deletedAt: null,
                    })
                    
                    const globalSettings = messageSettings.filter((setting) => !setting.user)
                    const userSettings = messageSettings.filter((setting) => setting.user)
                    
                    const transportEnabledMap = new Map()
                    messageTransports.forEach(transport => {
                        transportEnabledMap.set(transport, true)
                    })
                    globalSettings.forEach(setting => {
                        transportEnabledMap.set(setting.messageTransport, setting.isEnabled)
                    })
                    userSettings.forEach(setting => {
                        transportEnabledMap.set(setting.messageTransport, setting.isEnabled)
                    })
                    const allTransportsDisabled = Array.from(transportEnabledMap.values()).every(isEnabled => !isEnabled)
                    
                    if (allTransportsDisabled) {
                        logger.info({ msg: 'Message disabled by user for all transports', data: { user: to.user?.id, type } })
                            
                        return {
                            status: MESSAGE_DISABLED_BY_USER_STATUS,
                            id: null,
                            isDuplicateMessage: false,
                        }
                    }
                }

                let messageWithSameUniqKey
                if (uniqKey) {
                    messageWithSameUniqKey = await getByCondition('Message', {
                        uniqKey,
                        type,
                        deletedAt: null,
                    })
                }

                const message = messageWithSameUniqKey
                    ? messageWithSameUniqKey
                    : await Message.create(context, messageAttrs, MESSAGE_FIELDS)

                if (!messageWithSameUniqKey) await deliverMessage.applyAsync([message], getMessageQueue({ type }))

                return {
                    isDuplicateMessage: !!messageWithSameUniqKey,
                    id: message.id,
                    status: message.status,
                }
            },
        },
        {
            access: access.canSendMessage,
            schema: 'resendMessage(data: ResendMessageInput!): ResendMessageOutput',
            resolver: async (parent, args, context) => {
                const { data } = args
                const { dv, sender, message: messageInput } = data

                const message = await Message.update(context, messageInput.id, {
                    dv, sender,
                    status: MESSAGE_RESENDING_STATUS,
                    sentAt: null,
                    deliveredAt: null,
                    readAt: null,
                }, MESSAGE_FIELDS)

                await deliverMessage.applyAsync([message], getMessageQueue({ type: message.type }))

                return {
                    id: message.id,
                    status: message.status,
                }
            },
        },
    ],
})

module.exports = {
    SendMessageService,
}
