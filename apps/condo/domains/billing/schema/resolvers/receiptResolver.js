const Big = require('big.js')
const { isEmpty, pick, get } = require('lodash')

const { find } = require('@open-condo/keystone/schema')

const { ERRORS } = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { Resolver } = require('@condo/domains/billing/schema/resolvers/resolver')
const { BillingReceipt } = require('@condo/domains/billing/utils/serverSchema')
const RECEIPT_UPDATE_FIELDS = ['services', 'toPayDetails', 'recipient', 'period', 'category', 'account', 'property', 'receiver', 'importId', 'toPay']

class ReceiptResolver extends Resolver {
    constructor ({ billingContext, context }) {
        super(billingContext, context, { name: 'receipt' })
    }

    buildUniqKey (receipt) {
        const { accountNumber, category, addressResolve: { propertyAddress: { addressKey } }, period, receiver } = receipt
        // This is a unique combination to determine receipt
        // In majority of cases period + accountNumber + addressKey and receiver or category will be enough
        return [accountNumber, addressKey, period, receiver, category].join('_')
    }

    async processReceipts (receiptIndex) {
        for (const [index, receipt] of Object.entries(receiptIndex)) {
            const { importId, period, account, receiver, category } = receipt

            const sameReceiptQuery = importId ? {
                importId,
            } : {
                period,
                account: { id: account, deletedAt: null }, // accountNumber + addressKey
                OR: [
                    { receiver: { id: receiver } },
                    { category: { id: category } },
                ],
            }
            const receiptQuery = { ...sameReceiptQuery, context: { id: this.billingContext.id }, deletedAt: null }

            const existingReceipts = await find('BillingReceipt', receiptQuery)
            if (existingReceipts.length > 0) {
                let receiptToUpdate = existingReceipts.find(({ importId: existingImportId }) => existingImportId === importId)
                if (!receiptToUpdate) {
                    receiptToUpdate = existingReceipts[0]
                }
                receiptToUpdate.toPay = Big(receiptToUpdate.toPay).toFixed(2)
                receipt.toPay = Big(receipt.toPay).toFixed(2)
                const updateInput = this.buildUpdateInput(
                    pick(receipt, RECEIPT_UPDATE_FIELDS),
                    receiptToUpdate,
                    ['category', 'account', 'property', 'receiver']
                )
                const oldPaid = Big(get(receipt, 'toPayDetails.paid') || 0).toFixed(2)
                const newPaid = Big(get(receiptToUpdate, 'toPayDetails.paid') || 0).toFixed(2)
                if (receiptToUpdate.toPay !== receipt.toPay || oldPaid !== newPaid) {
                    updateInput['balanceUpdatedAt'] = new Date().toISOString()
                }
                if (!isEmpty(updateInput)) {
                    try {
                        receiptIndex[index] = await BillingReceipt.update(this.context, receiptToUpdate.id, { ...updateInput, raw: receipt }, 'id')
                    } catch (error) {
                        this.error(ERRORS.RECEIPT_SAVE_FAILED, index, error)
                    }
                } else {
                    receiptIndex[index] = { id: receiptToUpdate.id }
                }
            } else {
                if (!receipt.importId){
                    receipt.importId = this.buildUniqKey(receipt)
                }
                try {
                    receiptIndex[index] = await BillingReceipt.create(this.context, this.buildCreateInput({
                        ...pick(receipt, RECEIPT_UPDATE_FIELDS), context: this.billingContext.id, raw: receipt,
                    }, ['category', 'account', 'property', 'receiver', 'context']), 'id')
                } catch (error) {
                    this.error(ERRORS.RECEIPT_SAVE_FAILED, index, error)
                }
            }
        }
        return this.result(receiptIndex)
    }

}

module.exports = {
    ReceiptResolver,
}