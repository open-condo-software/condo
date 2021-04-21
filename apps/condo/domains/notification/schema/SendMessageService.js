const { GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@condo/domains/notification/access/SendMessageService')
const { EMAIL_TRANSPORT } = require('../constants')
const { LOCALES } = require('@condo/domains/common/constants/locale')
const { MESSAGE_TYPES, INVITE_NEW_EMPLOYEE_MESSAGE_TYPE } = require('@condo/domains/notification/constants')
const { Message } = require('@condo/domains/notification/utils/serverSchema')
const { sendMessageByTransport } = require('../tasks')

async function scheduleMessage (message) {
    if (message.type === INVITE_NEW_EMPLOYEE_MESSAGE_TYPE) {
        await sendMessageByTransport.delay(message.id, EMAIL_TRANSPORT)
        return
    }
    throw new Error('unsupported message + lang')
}

const SendMessageService = new GQLCustomSchema('SendMessageService', {
    types: [
        {
            access: true,
            type: `enum SendMessageLang { ${Object.keys(LOCALES).join(' ')} }`,
        },
        {
            access: true,
            type: `input SendMessageToInput { user: UserWhereUniqueInput, email: String, phone: String }`,
        },
        {
            access: true,
            type: `enum SendMessageType { ${MESSAGE_TYPES.join(' ')} }`,
        },
        {
            access: true,
            type: 'input SendMessageInput { dv: Int!, sender: JSON!, to: SendMessageToInput!, type: SendMessageType!, lang: SendMessageLang!, meta: JSON!, organization: OrganizationWhereUniqueInput }',
        },
        {
            access: true,
            type: 'type SendMessageOutput { status: String! }',
        },
    ],
    mutations: [
        {
            access: access.canSendMessage,
            schema: 'sendMessage(data: SendMessageInput!): SendMessageOutput',
            resolver: async (parent, args, context, info, extra = {}) => {
                const { data } = args
                const { dv, sender, to, type, meta, lang } = data
                if (!to.user && !to.email && !to.phone) throw new Error('invalid send to input')

                // TODO(pahaz): check meta
                const messageAttrs = { dv, sender, status: "sending", type, meta, lang }
                if (to.email) messageAttrs.email = to.email
                if (to.phone) messageAttrs.phone = to.phone
                if (to.user) messageAttrs.user = { connect: to.user }

                const message = await Message.create(context, messageAttrs)

                // TODO(pahaz): we should find message template by TYPE + LANG
                // then we should understand the best transport for the message
                // then send by transport!
                await scheduleMessage(message)  // TODO(pahaz): remove it!

                return {
                    status: 'ok',
                    messageId: message.id,
                }
            },
        },
    ],
})

module.exports = {
    SendMessageService,
}
