const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { VOIP_CANCELED_CALL_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

const logger = getLogger('sendIncomingVoIPCallNotification')

const prepareAndSendNotification = async (context, { userId, B2CAppId, callId }) => {
    const data = {
        userId,
        B2CAppId,
        callId,
    }
    const messageData = {
        to: { user: { id: userId } },
        type: VOIP_CANCELED_CALL_MESSAGE_TYPE,
        meta: {
            dv: 1,
            title: 'Canceling VoIP',
            body: 'Canceled VoIP',
            data,
        },
        sender: { dv: 1, fingerprint: 'send-canceling-voip-call-notification.' },
    }

    const { isDuplicateMessage } = await sendMessage(context, messageData)

    return (isDuplicateMessage) ? 0 : 1
}

const sendCancelingVoIPCallNotification = async ({ userId, B2CAppId, callId }) => {
    const { keystone: context } = await getSchemaCtx('RemoteClient')
    const success = await prepareAndSendNotification(context, { userId, B2CAppId, callId })

    logger.info({ msg: 'Send canceling VoIP call notification:', userId, B2CAppId, callId, success })
}

module.exports = {
    sendCancelingVoIPCallNotification,
}
