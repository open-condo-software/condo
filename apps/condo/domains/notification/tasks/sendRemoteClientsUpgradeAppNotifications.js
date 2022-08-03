/**
 * Sends notifications to devices that have old style (before release 1.55) app, that is incompatible with current API
 */

const pino = require('pino')
const falsey = require('falsey')

const { RESIDENT_UPGRADE_APP_TYPE, STAFF_UPGRADE_APP_TYPE, PUSH_TRANSPORT_FIREBASE } = require('@condo/domains/notification/constants/constants')
const conf = require('@core/config')
const { DEFAULT_LOCALE } = require('@condo/domains/common/constants/countries')
const { sendMessage, RemoteClient } = require('@condo/domains/notification/utils/serverSchema')
const { safeFormatError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { getSchemaCtx } = require('@core/keystone/schema')
const { isEmpty } = require('lodash')
const dayjs = require('dayjs')
const { DATE_FORMAT } = require('@condo/domains/common/utils/date')

const TODAY = dayjs().format(DATE_FORMAT)
const CHUNK_SIZE = 50

const logger = pino({
    name: 'send_billing_receipt_added_notifications',
    enabled: falsey(process.env.DISABLE_LOGGING),
})

const makeMessageKey = (deviceId, date) => `${date}:${deviceId}`

/**
 * Prepares data for sendMessage to resident on available billing receipt, then tries to send the message
 * @param keystone
 * @param receipt
 * @param resident
 * @returns {Promise<void>}
 */
const prepareAndSendNotification = async (context, remoteClient) => {
    const notificationKey = makeMessageKey(remoteClient.deviceId, TODAY)
    const messageType = remoteClient.owner.type === 'resident' ? RESIDENT_UPGRADE_APP_TYPE : STAFF_UPGRADE_APP_TYPE
    const data = {
        userId: remoteClient.owner.id,
        userType: remoteClient.owner.type,
        url: `${conf.SERVER_URL}/upgrateApp`,
    }
    const messageData = {
        lang: DEFAULT_LOCALE,
        to: { user: { id: remoteClient.owner.id } },
        type: messageType,
        meta: { dv: 1, data },
        sender: { dv: 1, fingerprint: 'send-remote-clients-upgrade-app-notific.' },
        uniqKey: notificationKey,
    }

    try {
        await sendMessage(context, messageData)
    } catch (e) {
        logger.info({ message: 'sendMessage attempt:', error: safeFormatError(e), messageData })

        return 0
    }

    return 1
}

const sendRemoteClientsUpgradeAppNotifications = async (where = {}) => {
    const { keystone: context } = await getSchemaCtx('RemoteClient')
    const remoteClientWhere = { ...where, appId: 'unknown', owner: { id_not: null }, pushToken_not: null, pushTransport: PUSH_TRANSPORT_FIREBASE }
    const remoteClientsCount = await RemoteClient.count(context, remoteClientWhere)
    let skip = 0, successCnt = 0

    logger.info({ message: 'Available obsolete remote clients:', remoteClientsCount, remoteClientWhere })

    if (!remoteClientsCount) return

    while (skip < remoteClientsCount) {
        const remoteClients = await RemoteClient.getAll(context, remoteClientWhere, { sortBy: ['createdAt_ASC'], first: CHUNK_SIZE, skip })

        if (isEmpty(remoteClients)) break

        skip += remoteClients.length

        for (const remoteClient of remoteClients) {
            const success = await prepareAndSendNotification(context, remoteClient)
            successCnt += success
        }
    }

    logger.info({ message: 'Notifications sent:', successCnt, attempts: remoteClientsCount })
}

module.exports = {
    makeMessageKey,
    sendRemoteClientsUpgradeAppNotifications,
}