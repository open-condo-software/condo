const { GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@condo/domains/notification/access/SendMessageService')
const { MESSAGE_SENDING_STATUS, MESSAGE_RESENDING_STATUS } = require('../constants')

const { JSON_UNKNOWN_VERSION_ERROR } = require('@condo/domains/common/constants/errors')
const { ALPHANUMERIC_REGEXP } = require('@condo/domains/common/constants/regexps')
const { LOCALES } = require('@condo/domains/common/constants/locale')
const { Message } = require('@condo/domains/notification/utils/serverSchema')

const { MESSAGE_TYPES } = require('../constants')
const {
    JSON_UNKNOWN_ATTR_NAME_ERROR,
    JSON_SUSPICIOUS_ATTR_NAME_ERROR,
    JSON_NO_REQUIRED_ATTR_ERROR,
    MESSAGE_META,
} = require('../constants')
const { deliveryMessage } = require('../tasks')

async function checkSendMessageMeta(type, meta) {
    if (meta.dv !== 1) throw new Error(`${JSON_UNKNOWN_VERSION_ERROR}meta] Unknown \`dv\` attr inside JSON Object`)
    const schema = MESSAGE_META[type]
    if (!schema) throw new Error('unsupported type or internal error')
    for (const attr of Object.keys(schema)) {
        const value = meta[attr]
        const { required } = schema[attr]
        if (required && !value) throw new Error(`${JSON_NO_REQUIRED_ATTR_ERROR}meta] no ${attr} value`)
    }
    for (const attr of Object.keys(meta)) {
        if (!ALPHANUMERIC_REGEXP.test(attr))
            throw new Error(`${JSON_SUSPICIOUS_ATTR_NAME_ERROR}meta] unsupported attr name charset`)
        if (!schema[attr]) throw new Error(`${JSON_UNKNOWN_ATTR_NAME_ERROR}meta] ${attr} is redundant or unknown`)
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
            type: 'input SendMessageInput { dv: Int!, sender: SenderFieldInput!, to: SendMessageToInput!, type: SendMessageType!, lang: SendMessageLang!, meta: JSON!, organization: OrganizationWhereUniqueInput }',
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
            resolver: async (parent, args, context, info, extra = {}) => {
                // TODO(pahaz): think about sending emails with attachments
                const { data } = args
                const { dv, sender, to, type, meta, lang } = data
                if (!to.user && !to.email && !to.phone) throw new Error('invalid send to input')

                await checkSendMessageMeta(type, meta)

                const messageAttrs = { dv, sender, status: MESSAGE_SENDING_STATUS, type, meta, lang }

                // TODO(pahaz): add email/phone validation
                if (to.email) messageAttrs.email = to.email
                if (to.phone) messageAttrs.phone = to.phone
                if (to.user) messageAttrs.user = { connect: to.user }

                const message = await Message.create(context, messageAttrs)

                await deliveryMessage.delay(message.id)

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
                    dv,
                    sender,
                    status: MESSAGE_RESENDING_STATUS,
                    deliveredAt: null,
                })

                await deliveryMessage.delay(message.id)

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
