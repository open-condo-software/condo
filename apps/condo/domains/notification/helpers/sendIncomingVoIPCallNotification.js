const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { VOIP_INCOMING_CALL_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

const logger = getLogger()

const prepareAndSendNotification = async (context, { userId, B2CAppId, callId }) => {
    const data = {
        userId,
        B2CAppId,
        callId,
    }
    const messageData = {
        to: { user: { id: userId } },
        type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
        meta: {
            dv: 1,
            title: 'Incoming VoIP call',
            body: 'Hello there!',
            data,
        },
        sender: { dv: 1, fingerprint: 'send-incoming-voip-call-notification.' },
    }

    const { isDuplicateMessage } = await sendMessage(context, messageData)

    return (isDuplicateMessage) ? 0 : 1
}

const sendIncomingVoIPCallNotification = async ({ userId, B2CAppId, callId }) => {
    const { keystone: context } = await getSchemaCtx('RemoteClient')
    const success = await prepareAndSendNotification(context, { userId, B2CAppId, callId })

    logger.info({ msg: 'send incoming VoIP call notification', data: { userId, B2CAppId, callId, success } })
}

module.exports = {
    sendIncomingVoIPCallNotification,
}
