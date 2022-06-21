/**
 * DEPRECATED! Please use send-receipt-added-notifications.js instead
 */

const { isEmpty, map, get } = require('lodash')

const conf = require('@core/config')

const { getStartDates } = require('@condo/domains/common/utils/date')

const { BillingReceipt } = require('@condo/domains/billing/utils/serverSchema')

const { Message } = require('@condo/domains/notification/utils/serverSchema')
const {
    BILLING_RECEIPT_AVAILABLE_TYPE,
    BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE,
    MESSAGE_SENT_STATUS, MESSAGE_DELIVERED_STATUS, MESSAGE_READ_STATUS, MESSAGE_ERROR_STATUS,
} = require('@condo/domains/notification/constants/constants')

const { Property } = require('@condo/domains/property/utils/serverSchema')
const { Resident, ServiceConsumer } = require('@condo/domains/resident/utils/serverSchema')

const { BillingContextScriptCore, prepareAndProceed } = require('../lib/billing-context-script-core')

// These are needed temporarily for backwards compatibility in order not to add extra migrations
const BILLING_RECEIPT_AVAILABLE_MANUAL_TYPE = 'BILLING_RECEIPT_AVAILABLE_MANUAL'
const BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_MANUAL_TYPE = 'BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_MANUAL'

/**
 This script sends push notifications to all users who are:
     * residents of the properties mentioned in billing receipts for provided period
 )
 */
class ReceiptsNotificationSender extends BillingContextScriptCore {
    async proceed () {
        const receiptsWhere = { context: { id: this.billingContextId, deletedAt: null }, period_in: [this.period], deletedAt: null }
        const receipts = await this.loadListByChunks(BillingReceipt, receiptsWhere)

        if (!receipts.length) {
            console.info('No BillingReceipt records for provided billingContextId and period with toPay > 0')

            process.exit(1)
        }

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
        const sentReceiptIds = new Set(map(sentMessagesInPeriod, 'meta.data.receiptId'))
        const properties = {}

        console.info('[INFO] messages sent within prev and curr month:', messagesSent.length)
        console.info('[INFO] messages sent with selected types in period:', sentMessagesInPeriod.length)

        let count = 0

        for (const receipt of receipts) {
            // ignore bills that are not payable or already received notification within period
            if (parseFloat(receipt.toPay) <= 0 || sentReceiptIds.has(receipt.id)) continue

            const serviceConsumerWhere = { billingIntegrationContext: { id: this.billingContextId, deletedAt: null }, billingAccount: { id: receipt.account.id, deletedAt: null }, deletedAt: null }
            const serviceConsumers = await this.loadListByChunks(ServiceConsumer, serviceConsumerWhere)

            if (isEmpty(serviceConsumers)) continue

            for (const consumer of serviceConsumers) {
                const residentId = get(consumer, 'resident.id', null)
                const resident = residentId ? await Resident.getOne(this.context, { id: consumer.resident.id, deletedAt: null }) : null

                if (isEmpty(resident)) continue

                let property = properties[resident.property.id]
                if (!properties[resident.property.id]) {
                    property = await Property.getOne(this.context, { id: resident.property.id, deletedAt: null })
                    properties[resident.property.id] = property
                }

                count++

                if (!this.forceSend) continue

                const data = {
                    receiptId: receipt.id,
                    residentId: resident.id,
                    userId: resident.user.id,
                    accountId: receipt.account.id,
                    url: `${conf.SERVER_URL}/billing/receipts/${receipt.id}`,
                    period: this.period,
                }

                await this.sendLocalizedMessage(resident.user.id, data)

                if (count >= this.maxSendCount) break
            }

            if (count >= this.maxSendCount) break
        }

        console.info(`[INFO] ${count} notifications ${!this.forceSend ? 'to be' : ''} sent.`)
    }
}

prepareAndProceed(ReceiptsNotificationSender, BILLING_RECEIPT_AVAILABLE_TYPE, true).then()
