const Big = require('big.js')
const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')
const pick = require('lodash/pick')

const { find } = require('@open-condo/keystone/schema')

const { ERRORS } = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { createStageContext } = require('@condo/domains/billing/schema/resolvers/resolver')
const { BillingReceipt } = require('@condo/domains/billing/utils/serverSchema')
const RECEIPT_UPDATE_FIELDS = ['services', 'toPayDetails', 'recipient', 'period', 'category', 'account', 'property', 'receiver', 'importId', 'toPay']

function buildReceiptIdentity (receipt) {
    const { accountNumber, category, addressResolve: { propertyAddress: { addressKey } }, period, receiver } = receipt
    return [accountNumber, addressKey, period, receiver, category].join('_')
}

async function resolveReceipts (receiptIndex, { billingContext, context }) {
    const stage = createStageContext({ name: 'receipt', context })
    const createdReceiptIds = new Set()
    for (const [index, receipt] of Object.entries(receiptIndex)) {
        const { importId, period, account, receiver, category } = receipt

        const sameReceiptQuery = importId ? {
            importId,
        } : {
            period,
            account: { id: account, deletedAt: null },
            OR: [
                { receiver: { id: receiver } },
                { category: { id: category } },
            ],
        }
        const receiptQuery = { ...sameReceiptQuery, context: { id: billingContext.id }, deletedAt: null }
        const existingReceipts = await find('BillingReceipt', receiptQuery)
        if (existingReceipts.length > 0) {
            const receiptToUpdate = existingReceipts.find(({ importId: existingImportId }) => existingImportId === importId) || existingReceipts[0]
            receiptToUpdate.toPay = Big(receiptToUpdate.toPay).toFixed(2)
            receipt.toPay = Big(receipt.toPay).toFixed(2)
            const updateInput = stage.buildUpdateInput(
                pick(receipt, RECEIPT_UPDATE_FIELDS),
                receiptToUpdate,
                ['category', 'account', 'property', 'receiver']
            )
            const oldPaid = Big(get(receipt, 'toPayDetails.paid') || 0).toFixed(2)
            const newPaid = Big(get(receiptToUpdate, 'toPayDetails.paid') || 0).toFixed(2)
            if (receiptToUpdate.toPay !== receipt.toPay || oldPaid !== newPaid) {
                updateInput.balanceUpdatedAt = new Date().toISOString()
            }
            if (!isEmpty(updateInput)) {
                try {
                    receiptIndex[index] = await BillingReceipt.update(context, receiptToUpdate.id, { ...updateInput, raw: receipt }, 'id')
                    stage.markUpdated()
                } catch (originalError) {
                    receiptIndex[index].error = stage.error(ERRORS.RECEIPT_SAVE_FAILED, index, originalError, { receiptIdentity: importId || `${account}:${period}` })
                }
            } else {
                stage.markUntouched()
                receiptIndex[index] = { id: receiptToUpdate.id }
            }
        } else {
            try {
                receiptIndex[index] = await BillingReceipt.create(context, stage.buildCreateInput({
                    ...pick(receipt, RECEIPT_UPDATE_FIELDS), context: billingContext.id, raw: receipt,
                }, ['category', 'account', 'property', 'receiver', 'context']), 'id')
                stage.markCreated()
                createdReceiptIds.add(receiptIndex[index].id)
            } catch (originalError) {
                receiptIndex[index].error = stage.error(ERRORS.RECEIPT_SAVE_FAILED, index, originalError, { receiptIdentity: importId || buildReceiptIdentity(receipt) })
            }
        }
    }
    return stage.result(receiptIndex, { createdReceiptIds })
}

module.exports = {
    resolveReceipts,
}
