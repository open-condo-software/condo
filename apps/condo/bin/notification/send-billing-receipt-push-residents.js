/**
 * DEPRECATED! Please use send-residents-no-account-notifications.js instead
 */

const conf = require('@core/config')
const { flatten, uniq, get } = require('lodash')

const { getStartDates } = require('@condo/domains/common/utils/date')

const { BillingReceipt, BillingProperty } = require('@condo/domains/billing/utils/serverSchema')

const { Message, RemoteClient } = require('@condo/domains/notification/utils/serverSchema')
const {
    BILLING_RECEIPT_AVAILABLE_TYPE,
    BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE,
    MESSAGE_SENT_STATUS, MESSAGE_DELIVERED_STATUS, MESSAGE_READ_STATUS, MESSAGE_ERROR_STATUS,
} = require('@condo/domains/notification/constants/constants')

const { Property } = require('@condo/domains/property/utils/serverSchema')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')

const { BillingContextScriptCore, prepareAndProceed } = require('../lib/billing-context-script-core')
const { getUniqueByField, getConnectionsMapping } = require('../lib/helpers')

// These are needed temporarily for backwards compatibility in order not to add extra migrations
const BILLING_RECEIPT_AVAILABLE_MANUAL_TYPE = 'BILLING_RECEIPT_AVAILABLE_MANUAL'
const BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_MANUAL_TYPE = 'BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_MANUAL'

/**
 This script sends push notifications to all users who are:
     * residents of the properties:
        - of the organization with provided billingContextId
        - having at least one billing receipt for provided period on the property
     * have available pushTokens
     * have not been sent this king of notifications during current month yet
 */
class ResidentsNotificationSender extends BillingContextScriptCore {
    async proceed () {
        const receiptsWhere = { context: { id: this.billingContextId, deletedAt: null }, period_in: [this.period], deletedAt: null }
        const receipts = await this.loadListByChunks(BillingReceipt, receiptsWhere)

        if (!receipts.length) {
            console.error('No BillingReceipt records found for provided billingContextId and period')

            process.exit(1)
        }

        console.info(`[INFO] ${receipts.length} Receipt rows found.`)

        const billingPropertyIds = getUniqueByField(receipts, 'property.id')

        const billingPropertiesWhere = { deletedAt: null, id_in: billingPropertyIds }
        const billingProperties = await this.loadListByChunks(BillingProperty, billingPropertiesWhere)

        console.info(`[INFO] ${billingProperties.length} BillingProperty rows found for ${billingPropertyIds.length} ids:`, billingPropertyIds)

        const propertyAddresses = getUniqueByField(billingProperties, 'address')

        console.info(`[INFO] ${propertyAddresses.length} addresses found:`, propertyAddresses)

        const propertiesWhere = { deletedAt: null, address_in: propertyAddresses }
        const properties = await this.loadListByChunks(Property, propertiesWhere)

        const propertyIds = getUniqueByField(properties, 'id')

        console.info(`[INFO] ${propertyIds.length} properties found for ${propertyAddresses.length} addresses`)

        const { prevMonthStart, nextMonthStart } = getStartDates()
        const messagesWhere = {
            deletedAt: null,
            type_in: [
                BILLING_RECEIPT_AVAILABLE_TYPE,
                BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE,
                BILLING_RECEIPT_AVAILABLE_MANUAL_TYPE,
                BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_MANUAL_TYPE,
            ],
            status_in: [MESSAGE_SENT_STATUS, MESSAGE_DELIVERED_STATUS, MESSAGE_READ_STATUS, MESSAGE_ERROR_STATUS],
            createdAt_gte: prevMonthStart,
            createdAt_lt: nextMonthStart,
        }

        const messagesSent = await this.loadListByChunks(Message, messagesWhere)
        const sentMessagesInPeriod = messagesSent.filter((message) => get(message, 'meta.data.period') === this.period)
        const sentResidentIds1 = getUniqueByField(sentMessagesInPeriod, 'meta.data', 'residentId')
        const sentResidentIds2 = flatten(getUniqueByField(sentMessagesInPeriod, 'meta.data', 'residentIds'))
        /**
         * Here we collect all ids of residents that have been sent same notifications for requested period within prev and curr month
         * during previous executions of this script or any other script/code invoking same type of notification
         */
        const excludeResidentIds = uniq(flatten([...sentResidentIds1, ...sentResidentIds2]))

        console.info(`[INFO] ${excludeResidentIds.length} users already received notifications.`)

        console.info('[INFO] Reading residents info.')

        const residentsWhere = { deletedAt: null, property: { id_in: propertyIds }, id_not_in: excludeResidentIds }
        const residents = await this.loadListByChunks(Resident, residentsWhere)

        // get only users, whom we didn't send notifications within current month yet.
        const userIds = getUniqueByField(residents, 'user.id')
        const usersToResidentsMapping = getConnectionsMapping(residents, 'user.id')

        console.info(`[INFO] ${userIds.length} users without notifications found among ${residents.length} residents.`)

        const devicesWhere = { deletedAt: null, pushToken_not: null, owner: { id_in: userIds } }
        const devices = await this.loadListByChunks(RemoteClient, devicesWhere)
        const deviceUserIds = getUniqueByField(devices, 'owner.id')

        if (!this.forceSend) {
            console.info(`[INFO] ${deviceUserIds.length} users with pushTokens found to be sent notifications to among ${devices.length} devices.`)

            process.exit(0)
        }

        let count = 0

        for (const userId of deviceUserIds) {
            count++

            const data = {
                userId,
                residentId: usersToResidentsMapping[userId][0],
                residentIds: usersToResidentsMapping[userId],
                url: `${conf.SERVER_URL}/billing/receipts/`,
                period: this.period,
            }

            await this.sendLocalizedMessage(userId, data)

            if (count >= this.maxSendCount) break
        }

        console.info(`[INFO] ${count} notifications ${!this.forceSend ? 'to be' : ''} sent.`)
    }
}

prepareAndProceed(ResidentsNotificationSender, BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE, true).then()
