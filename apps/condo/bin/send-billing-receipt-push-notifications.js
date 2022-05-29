const isEmpty = require('lodash/isEmpty')

const conf = require('@core/config')

const { BillingReceipt } = require('@condo/domains/billing/utils/serverSchema')

const { BILLING_RECEIPT_AVAILABLE_TYPE } = require('@condo/domains/notification/constants/constants')

const { Resident, ServiceConsumer } = require('@condo/domains/resident/utils/serverSchema')

const { BillingContextScriptCore, prepareAndProceed } = require('./lib/billing-context-script-core')

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

            process.exit(0)
        }

        let count = 0

        for (const receipt of receipts) {
            // ignore bills that are not payable
            if (parseFloat(receipt.toPay) > 0) {
                const serviceConsumerWhere = { billingIntegrationContext: { id: this.billingContextId, deletedAt: null }, billingAccount: { id: receipt.account.id, deletedAt: null }, deletedAt: null }
                const serviceConsumers = await this.loadListByChunks(ServiceConsumer, serviceConsumerWhere)

                if (isEmpty(serviceConsumers)) continue

                for (const consumer of serviceConsumers) {
                    const resident = await Resident.getOne(this.context, { id: consumer.resident.id, deletedAt: null })

                    if (!isEmpty(resident)) {
                        count++

                        if (this.forceSend) {
                            const data = {
                                receiptId: receipt.id,
                                residentId: resident.id,
                                userId: resident.user.id,
                                accountId: receipt.account.id,
                                url: `${conf.SERVER_URL}/billing/receipts/${receipt.id}`,
                            }

                            await this.sendLocalizedMessage(resident.user.id, data)
                        }
                    }

                    if (count >= this.maxSendCount) break
                }
            }

            if (count >= this.maxSendCount) break
        }

        console.info(`[INFO] ${count} notifications ${!this.forceSend ? 'to be' : ''} sent.`)
    }
}

prepareAndProceed(ReceiptsNotificationSender, BILLING_RECEIPT_AVAILABLE_TYPE, true).then()
