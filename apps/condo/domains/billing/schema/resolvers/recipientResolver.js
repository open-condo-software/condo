const { isEmpty, get } = require('lodash')

const { getOrganizationInfo, getBankInfo } = require('@open-condo/clients/finance-info-client')
const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')
const { getById, find } = require('@open-condo/keystone/schema')

const {
    ERRORS,
    RECIPIENT_IS_NOT_APPROVED,
} = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { Resolver } = require('@condo/domains/billing/schema/resolvers/resolver')

const BILLING_RECIPIENT_FIELDS = '{ id name bankName bankAccount tin iec bic offsettingAccount territoryCode isApproved }'
const BillingRecipientGQL = generateGqlQueries('BillingRecipient', BILLING_RECIPIENT_FIELDS)
const BillingRecipientApi = generateServerUtils(BillingRecipientGQL)
class RecipientResolver extends Resolver {
    constructor ({ billingContext, context }) {
        super(billingContext, context, { name: 'recipient' })
        this.recipients = []
    }
    async init () {
        await this.loadExistingRecipients()
        this.organization = await getById('Organization', get(this.billingContext, 'organization.id'))
    }

    async loadExistingRecipients () {
        this.recipients = await find('BillingRecipient', { context: { id: this.billingContext.id }, deletedAt: null })
    }

    async syncBillingRecipient (existing, data){
        if (!existing) {
            try {
                data.isApproved = data.tin && data.tin === this.organization.tin
                const newRecipient = await BillingRecipientApi.create(this.context, this.buildCreateInput(data, ['context']))
                await this.loadExistingRecipients()
                return newRecipient
            } catch (error) {
                return { error: ERRORS.RECIPIENT_SAVE_FAILED }
            }
        } else {
            const updateInput = this.buildUpdateInput(data, existing)
            if (!isEmpty(updateInput)) {
                try {
                    const updatedRecipient = await BillingRecipientApi.update(this.context, existing.id, updateInput)
                    await this.loadExistingRecipients()
                    return updatedRecipient
                } catch (error) {
                    return { error: ERRORS.RECIPIENT_SAVE_FAILED }
                }
            } else {
                return existing
            }
        }
    }
    async getReceiver ({ tin, routingNumber, bankAccount } ) {
        const existingRecipient = this.recipients.find(({ bankAccount: existingBankAccount }) => existingBankAccount === bankAccount)
        const { error: getBankError, result: routingNumberMeta  } = await getBankInfo(routingNumber)
        const { error: getOrganizationError, result: tinMeta } = await getOrganizationInfo(tin)
        if (getBankError){
            return { error: ERRORS.BANK_FOUND_ERROR }
        }
        if (getOrganizationError) {
            return { error: ERRORS.ORGANIZATION_FOUND_ERROR }
        }
        const bankName = get(routingNumberMeta, 'bankName', get(existingRecipient, 'bankName', null))
        const offsettingAccount = get(routingNumberMeta, 'offsettingAccount', get(existingRecipient, 'offsettingAccount', null))
        const name = get(tinMeta, 'name', get(existingRecipient, 'name', null))
        const iec = get(tinMeta, 'iec', get(existingRecipient, 'iec', null))
        const territoryCode = get(tinMeta, 'territoryCode', get(existingRecipient, 'territoryCode', null))
        const { error, id, isApproved } = await this.syncBillingRecipient(existingRecipient, { context: this.billingContext.id, name, iec, tin, bankAccount, bankName, bic: routingNumber, offsettingAccount, territoryCode })
        if (error) {
            return { error }
        }
        // TODO(dkovyazin): DOMA-7656 Remove after removing recipient field from BillingReceipt
        const recipient = { name, bankName, territoryCode, offsettingAccount, tin, iec, bic: routingNumber, bankAccount }
        if (!isApproved) {
            return { problem: RECIPIENT_IS_NOT_APPROVED, result: { id, recipient } }
        }
        return { result: { id, recipient } }
    }
    async processReceipts (receiptIndex) {
        const receiverSyncResult = {}
        for (const [index, receipt] of Object.entries(receiptIndex)) {
            const { tin, routingNumber, bankAccount } = receipt
            if (!receiverSyncResult[bankAccount]) {
                receiverSyncResult[bankAccount] = await this.getReceiver({ tin, routingNumber, bankAccount } )
            }
            const { error, problem, result } = receiverSyncResult[receipt.bankAccount]
            if (error) {
                receiptIndex[index].error = this.error(error, index)
            }
            if (problem) {
                receiptIndex[index].problems.push({ problem, params: { tin, routingNumber, bankAccount } })
            }
            if (result) {
                receiptIndex[index].receiver = result.id
                receiptIndex[index].recipient = result.recipient
            }
        }
        return this.result(receiptIndex)
    }

}

module.exports = {
    RecipientResolver,
}