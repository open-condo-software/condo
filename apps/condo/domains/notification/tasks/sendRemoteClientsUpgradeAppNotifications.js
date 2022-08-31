/**
 * Sends notifications to devices that have old style (before release 1.55) app, that is incompatible with current API
 */

const { RESIDENT_UPGRADE_APP_TYPE, STAFF_UPGRADE_APP_TYPE, PUSH_TRANSPORT_FIREBASE } = require('@condo/domains/notification/constants/constants')
const conf = require('@condo/config')
const { sendMessage, RemoteClient } = require('@condo/domains/notification/utils/serverSchema')
const { getSchemaCtx } = require('@condo/keystone/schema')
const { isEmpty } = require('lodash')
const dayjs = require('dayjs')
const { DATE_FORMAT } = require('@condo/domains/common/utils/date')
const { getLogger } = require('@condo/keystone/logging')

const TODAY = dayjs().format(DATE_FORMAT)
const CHUNK_SIZE = 50

const logger = getLogger('sendRemoteClientsUpgradeAppNotifications')

const makeMessageKey = (entityId, date) => `${date}:${entityId}`

/**
 * Prepares data for sendMessage to resident on available billing receipt, then tries to send the message
 * @param keystone
 * @param receipt
 * @param resident
 * @returns {Promise<number>}
 */
const prepareAndSendNotification = async (context, remoteClient) => {
    const notificationKey = makeMessageKey(remoteClient.owner.id, TODAY)
    const messageType = remoteClient.owner.type === 'resident' ? RESIDENT_UPGRADE_APP_TYPE : STAFF_UPGRADE_APP_TYPE
    const data = {
        userId: remoteClient.owner.id,
        userType: remoteClient.owner.type,
        url: `${conf.SERVER_URL}/upgrateApp`,
    }
    const messageData = {
        to: { user: { id: remoteClient.owner.id } },
        type: messageType,
        meta: { dv: 1, data },
        sender: { dv: 1, fingerprint: 'send-remote-clients-upgrade-app-notific.' },
        uniqKey: notificationKey,
    }

    try {
        const { isDuplicateMessage } = await sendMessage(context, messageData)
        return (isDuplicateMessage) ? 0 : 1
    } catch (error) {
        logger.info({ msg: 'sendMessage error', error, data: messageData })
        return 0
    }
}

const sendRemoteClientsUpgradeAppNotifications = async (where = {}) => {
    const { keystone: context } = await getSchemaCtx('RemoteClient')
    const remoteClientWhere = { ...where, appId: 'unknown', owner: { id_not: null }, pushToken_not: null, pushTransport: PUSH_TRANSPORT_FIREBASE }
    const remoteClientsCount = await RemoteClient.count(context, remoteClientWhere)
    let skip = 0, successCnt = 0

    logger.info({ msg: 'Available obsolete remote clients:', remoteClientsCount, data: remoteClientWhere })

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

    logger.info({ msg: 'Notifications sent', successCnt, attempts: remoteClientsCount })
}

module.exports = {
    makeMessageKey,
    sendRemoteClientsUpgradeAppNotifications,
}