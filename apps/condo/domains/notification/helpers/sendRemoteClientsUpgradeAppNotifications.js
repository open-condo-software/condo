/**
 * Sends notifications to devices that have old style (before release 2.0.0) app, that is incompatible with current API
 */

const dayjs = require('dayjs')
const { isEmpty } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { DATE_FORMAT } = require('@condo/domains/common/utils/date')
const { RESIDENT_UPGRADE_APP_TYPE, STAFF_UPGRADE_APP_TYPE, PUSH_TRANSPORT_FIREBASE } = require('@condo/domains/notification/constants/constants')
const { sendMessage, RemoteClient } = require('@condo/domains/notification/utils/serverSchema')

const TODAY = dayjs().format(DATE_FORMAT)
const CHUNK_SIZE = 50

const logger = getLogger()

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

    const { isDuplicateMessage } = await sendMessage(context, messageData)
    
    return (isDuplicateMessage) ? 0 : 1
}

const sendRemoteClientsUpgradeAppNotifications = async (where = {}) => {
    const { keystone: context } = getSchemaCtx('RemoteClient')
    const remoteClientWhere = { ...where, appId: 'unknown', owner: { id_not: null }, pushToken_not: null, pushTransport: PUSH_TRANSPORT_FIREBASE }
    const remoteClientsCount = await RemoteClient.count(context, remoteClientWhere)
    let skip = 0, successCnt = 0

    logger.info({
        msg: 'available obsolete remote clients',
        count: remoteClientsCount,
        data: remoteClientWhere,
    })

    if (!remoteClientsCount) return

    while (skip < remoteClientsCount) {
        const remoteClients = await RemoteClient.getAll(context,
            remoteClientWhere,
            'id owner { id type }',
            { sortBy: ['createdAt_ASC'], first: CHUNK_SIZE, skip }
        )

        if (isEmpty(remoteClients)) break

        skip += remoteClients.length

        for (const remoteClient of remoteClients) {
            const success = await prepareAndSendNotification(context, remoteClient)
            successCnt += success
        }
    }

    logger.info({ msg: 'notifications sent', data: { successCnt, attempts: remoteClientsCount } })
}

module.exports = {
    makeMessageKey,
    sendRemoteClientsUpgradeAppNotifications,
}