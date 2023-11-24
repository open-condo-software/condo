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
        this.recipients = await find('BillingRecipient', { context: { id: this.billingContext.id }, deletedAt: null })
        this.organization = await getById('Organization', get(this.billingContext, 'organization.id'))
    }
    async syncBillingRecipient (existing, updateInput){
        updateInput.isApproved = updateInput.tin && updateInput.tin === this.organization.tin
        if (!existing) {
            this.created++
            return await BillingRecipientApi.create(this.context, { ...this.dvSender, ...updateInput })
        } else {
            const fieldsToCheck = ['name', 'isApproved', 'bankName', 'bankAccount', 'tin', 'iec', 'bic', 'offsettingAccount', 'territoryCode']
            const fieldsToUpdate = {}
            for (const fieldName of fieldsToCheck) {
                if (existing[fieldName] !== updateInput[fieldName]) {
                    fieldsToUpdate[fieldName] = updateInput[fieldName]
                }
            }
            if (!isEmpty(fieldsToUpdate)) {
                this.updated++
                return await BillingRecipientApi.update(this.context, existing.id, { ...this.dvSender, ...fieldsToUpdate })
            } else {
                this.unTouched++
                return existing
            }
        }
    }
    async getReceiver ({ tin, routingNumber, bankAccount } ) {
        const existingRecipient = this.recipients.find(({ bankAccount: existingBankAccount }) => existingBankAccount === bankAccount)
        const { error: getBankError, result: routingNumberMeta  } = await getBankInfo(routingNumber)
        const { error: getOrganizationError, result: tinMeta } = await getOrganizationInfo(tin)
        if (getBankError){
            return { error: this.error(ERRORS.BANK_FOUND_ERROR) }
        }
        if (getOrganizationError) {
            return { error: this.error(ERRORS.ORGANIZATION_FOUND_ERROR) }
        }
        const bankName = get(routingNumberMeta, 'bankName', get(existingRecipient, 'bankName', null))
        const offsettingAccount = get(routingNumberMeta, 'offsettingAccount', get(existingRecipient, 'offsettingAccount', null))
        const name = get(tinMeta, 'name', get(existingRecipient, 'name', null))
        const iec = get(tinMeta, 'iec', get(existingRecipient, 'iec', null))
        const territoryCode = get(tinMeta, 'territoryCode', get(existingRecipient, 'territoryCode', null))
        const { id, isApproved } = await this.syncBillingRecipient(existingRecipient, { context: { connect: { id: this.billingContext.id } }, name, iec, tin, bankAccount, bankName, bic: routingNumber, offsettingAccount, territoryCode })
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
                receiptIndex[index].error = error
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