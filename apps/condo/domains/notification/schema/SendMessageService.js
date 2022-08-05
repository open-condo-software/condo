const { GQLCustomSchema } = require('@core/keystone/schema')
const { LOCALES } = require('@condo/domains/common/constants/locale')
const { Message } = require('@condo/domains/notification/utils/serverSchema')
const access = require('@condo/domains/notification/access/SendMessageService')
const {
    MESSAGE_TYPES,
    MESSAGE_META,
    MESSAGE_SENDING_STATUS,
    MESSAGE_RESENDING_STATUS,
} = require('../constants/constants')
const { deliverMessage } = require('../tasks')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@core/keystone/errors')
const { REQUIRED, UNKNOWN_ATTRIBUTE, WRONG_VALUE, DV_VERSION_MISMATCH } = require('@condo/domains/common/constants/errors')

const errors = {
    EMAIL_FROM_REQUIRED: {
        mutation: 'sendMessage',
        variable: ['data', 'to', 'email'],
        code: BAD_USER_INPUT,
        type: REQUIRED,
        message: 'You can not use emailFrom without to.email',
    },
    USER_OR_EMAIL_OR_PHONE_REQUIRED: {
        mutation: 'sendMessage',
        variable: ['data'],
        code: BAD_USER_INPUT,
        type: REQUIRED,
        message: 'You should provide either "user" or "email" or "phone" attribute',
    },
    UNKNOWN_META_ATTRIBUTE: {
        mutation: 'sendMessage',
        variable: ['data', 'meta'],
        code: BAD_USER_INPUT,
        type: UNKNOWN_ATTRIBUTE,
        message: 'Unknown attribute "{attr}" provided to "meta" variable',
    },
    MISSING_VALUE_FOR_REQUIRED_META_ATTRIBUTE: {
        mutation: 'sendMessage',
        variable: ['data', 'meta'],
        code: BAD_USER_INPUT,
        type: REQUIRED,
        message: 'Missing value for required "meta.{attr}" attribute',
    },
    UNKNOWN_MESSAGE_TYPE: {
        mutation: 'sendMessage',
        variable: ['data', 'meta'],
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        message: 'Unknown value "{type}" provided for message type',
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
    if (meta.dv !== 1) throw new GQLError(errors.DV_VERSION_MISMATCH, context)
    const schema = MESSAGE_META[type]
    if (!schema) {
        throw new GQLError({ ...errors.UNKNOWN_MESSAGE_TYPE, messageInterpolation: { type } }, context)
    }
    for (const attr of Object.keys(schema)) {
        const value = meta[attr]
        const { required } = schema[attr]
        if (required && !value) {
            throw new GQLError({ ...errors.MISSING_VALUE_FOR_REQUIRED_META_ATTRIBUTE, messageInterpolation: { attr } }, context)
        }
    }
    for (const attr of Object.keys(meta)) {
        if (!schema[attr]) {
            throw new GQLError({ ...errors.UNKNOWN_META_ATTRIBUTE, messageInterpolation: { attr } }, context)
        }
    }
}

const SendMessageService = new GQLCustomSchema('SendMessageService', {
    types: [
        {
            access: true,
            type: `enum SendMessageLang { ${Object.keys(LOCALES).join(' ')} }`,
        },
        {
            access: true,
            type: 'input SendMessageToInput { user: UserWhereUniqueInput, email: String, phone: String }',
        },
        {
            access: true,
            type: `enum SendMessageType { ${MESSAGE_TYPES.join(' ')} }`,
        },
        {
            access: true,
            type: 'input SendMessageInput { dv: Int!, sender: SenderFieldInput!, to: SendMessageToInput!, emailFrom: String, type: SendMessageType!, lang: SendMessageLang!, meta: JSON!, organization: OrganizationRelateToOneInput, uniqKey: String }',
        },
        {
            access: true,
            type: 'type SendMessageOutput { status: String!, id: String! }',
        },
        {
            access: true,
            type: 'input ResendMessageInput { dv: Int!, sender: SenderFieldInput!, message: MessageWhereUniqueInput }',
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
                errors,
            },
            resolver: async (parent, args, context) => {
                // TODO(pahaz): think about sending emails with attachments
                const { data } = args
                const { dv, sender, to, emailFrom, type, meta, lang, uniqKey, organization } = data
                if (!to.user && !to.email && !to.phone) throw new GQLError(errors.USER_OR_EMAIL_OR_PHONE_REQUIRED, context)

                if (emailFrom && !to.email) throw new GQLError(errors.EMAIL_FROM_REQUIRED, context)

                await checkSendMessageMeta(type, meta, context)

                const messageAttrs = { dv, sender, status: MESSAGE_SENDING_STATUS, type, meta, lang, emailFrom, uniqKey, organization }

                // TODO(pahaz): add email/phone validation
                if (to.email) messageAttrs.email = to.email
                if (to.phone) messageAttrs.phone = to.phone
                if (to.user) messageAttrs.user = { connect: to.user }

                const message = await Message.create(context, messageAttrs)

                await deliverMessage.delay(message.id)

                return {
                    id: message.id,
                    status: message.status,
                }
            },
        },
        {
            access: access.canSendMessage,
            schema: 'resendMessage(data: ResendMessageInput!): ResendMessageOutput',
            resolver: async (parent, args, context, info, extra = {}) => {
                const { data } = args
                const { dv, sender, message: messageInput } = data

                const message = await Message.update(context, messageInput.id, {
                    dv, sender,
                    status: MESSAGE_RESENDING_STATUS,
                    sentAt: null,
                    deliveredAt: null,
                    readAt: null,
                })

                await deliverMessage.delay(message.id)

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
