const Big = require('big.js')
const { isEmpty, isEqual, xorWith } = require('lodash')

const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')
const { find } = require('@open-condo/keystone/schema')

const { Resolver } = require('@condo/domains/billing/schema/resolvers/resolver')


const BILLING_RECEIPT_FIELDS = '{ id }'
const BillingReceiptGQL = generateGqlQueries('BillingReceipt', BILLING_RECEIPT_FIELDS)
const BillingReceiptApi = generateServerUtils(BillingReceiptGQL)

const isArrayEqual = (x, y) => isEmpty(xorWith(x, y, isEqual))
const isAmountEqual = (x, y) => !isNaN(Number(x)) && !isNaN(y) && Big(x).eq(Big(y))

class ReceiptResolver extends Resolver {
    constructor ({ billingContext, context }) {
        super(billingContext, context, { name: 'receipt' })
    }

    buildUniqKey (receipt) {
        const { accountNumber, addressResolve: { propertyAddress: { addressKey } }, period, receiver } = receipt
        return [accountNumber, addressKey, period, receiver].join('_')
    }

    async processReceipts (receiptIndex) {
        for (const [index, receipt] of Object.entries(receiptIndex)) {
            const uniqKey = this.buildUniqKey(receipt)
            const { importId, period, property, account, receiver } = receipt
            //const sameReceiptQuery = { importId, context: { id: this.billingContext.id }, deletedAt: null }
            const sameReceiptQuery = {
                OR: [
                    {
                        AND: [
                            { importId },
                            { context: { id: this.billingContext.id } },
                            { deletedAt: null },
                        ],
                    },
                    {
                        AND: [
                            { period },
                            { property: { id: property, deletedAt: null } },
                            { account: { id: account, deletedAt: null } },
                            { receiver: { id: receiver, deletedAt: null } },
                            { context: { id: this.billingContext.id } },
                            { deletedAt: null },
                        ],
                    },
                ],
            }
            const existingReceipts = await find('BillingReceipt', sameReceiptQuery)
            if (existingReceipts.length > 0) {
                let receiptToUpdate = existingReceipts.find(({ importId: existingImportId }) => existingImportId === importId)
                if (!receiptToUpdate) {
                    receiptToUpdate = existingReceipts[0]
                }
                const updateInput = {
                    ...(receipt.period !== receiptToUpdate.period) ? { period: receipt.period } : {},
                    ...(receipt.category !== receiptToUpdate.category) ? { category: { connect : { id: receipt.category } } } : {},
                    ...(receipt.account !== receiptToUpdate.account) ? { category: { connect: { id: receipt.account } } } : {},
                    ...(receipt.property !== receiptToUpdate.property) ? { category: { connect: { id: receipt.property } } } : {},
                    ...(receipt.receiver !== receiptToUpdate.receiver) ? { category: { connect: { id: receipt.receiver } } } : {},
                    ...(receipt.importId !== receiptToUpdate.importId) ? { importId: receipt.importId } : {},
                    ...(!isAmountEqual(receipt.toPay, receiptToUpdate.toPay)) ? { toPay: receipt.toPay } : {},
                    ...(!isEmpty(receipt.recipient) && !isEqual(receipt.recipient, receiptToUpdate.recipient)) ? { recipient: receipt.recipient } : {},
                    ...(!isEmpty(receipt.raw) && !isEqual(receipt.raw, receiptToUpdate.raw)) ? { raw: receipt.raw } : {},
                    ...(!isEmpty(receipt.toPayDetails) && !isEqual(receipt.toPayDetails, receiptToUpdate.toPayDetails)) ? { toPayDetails: receipt.toPayDetails } : {},
                    ...(!isEmpty(receipt.services) && !isArrayEqual(receipt.services, receiptToUpdate.services)) ? { services: receipt.services } : {},
                }
                if (!isEmpty(updateInput)) {
                    this.updated++
                    receiptIndex[index] = await BillingReceiptApi.update(this.context, receiptToUpdate.id, {
                        ...this.dvSender,
                        ...updateInput,
                    })
                } else {
                    this.unTouched++
                    receiptIndex[index] = { id: receiptToUpdate.id }
                }
            } else {
                const createInput = {
                    ...this.dvSender,
                    period: receipt.period,
                    category: { connect : { id: receipt.category } },
                    account: { connect: { id: receipt.account } },
                    property: { connect: { id: receipt.property } },
                    receiver: { connect: { id: receipt.receiver } },
                    recipient: receipt.recipient,
                    context: { connect: { id: this.billingContext.id } },
                    importId: receipt.importId ? importId : uniqKey,
                    ...receipt.raw ? { raw: receipt.raw } : {},
                    toPay: receipt.toPay,
                    toPayDetails: receipt.toPayDetails,
                    services: receipt.services,
                }
                this.created++
                receiptIndex[index] = await BillingReceiptApi.create(this.context, createInput)
            }
        }
        return this.result(receiptIndex)
    }

}

module.exports = {
    ReceiptResolver,
}