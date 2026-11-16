const { isEmpty, get } = require('lodash')

const { getOrganizationInfo, getBankInfo } = require('@open-condo/clients/finance-info-client')
const { find } = require('@open-condo/keystone/schema')

const {
    ERRORS,
    RECIPIENT_IS_NOT_APPROVED,
} = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { Resolver } = require('@condo/domains/billing/schema/resolvers/resolver')
const { BillingRecipient } = require('@condo/domains/billing/utils/serverSchema')


const BILLING_RECIPIENT_FIELDS = '{ id name bankName bankAccount tin iec bic offsettingAccount territoryCode isApproved }'
const INFRASTRUCTURE_ERROR_CODES = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'ENETUNREACH',
    'ENOTFOUND',
    'ETIMEDOUT',
])

const isInfrastructureError = (error) => error instanceof Error && (
    error.message.startsWith('Failed to fetch:') ||
    INFRASTRUCTURE_ERROR_CODES.has(error.code) ||
    error.name === 'FetchError' ||
    error.name === 'MaxRetriesPerRequestError'
)

class RecipientResolver extends Resolver {
    constructor ({ billingContext, context }) {
        super(billingContext, context, { name: 'recipient' })
        this.recipients = []
    }
    async init () {
        await this.loadExistingRecipients()
    }

    async loadExistingRecipients () {
        this.recipients = await find('BillingRecipient', { context: { id: this.billingContext.id }, deletedAt: null })
    }

    async syncBillingRecipient (existing, data) {
        if (!existing) {
            try {
                const newRecipient = await BillingRecipient.create(
                    this.context,
                    this.buildCreateInput(data, ['context']),
                    BILLING_RECIPIENT_FIELDS
                )
                this.recipients.push(newRecipient)
                return newRecipient
            } catch (error) {
                return { error: { ...ERRORS.RECIPIENT_SAVE_FAILED, messageInterpolation: { bankAccount: data.bankAccount } } }
            }
        } else {
            const updateInput = this.buildUpdateInput(data, existing)
            if (!isEmpty(updateInput)) {
                try {
                    const updatedRecipient = await BillingRecipient.update(
                        this.context,
                        existing.id,
                        updateInput,
                        BILLING_RECIPIENT_FIELDS,
                    )
                    this.recipients.push(updatedRecipient)
                    return updatedRecipient
                } catch (error) {
                    return { error: { ...ERRORS.RECIPIENT_SAVE_FAILED, messageInterpolation: { bankAccount: data.bankAccount } } }
                }
            } else {
                return existing
            }
        }
    }
    async prepareReceiver ({ tin, routingNumber, bankAccount }) {
        const existingRecipient = this.recipients.find(({ bankAccount: existingBankAccount }) => existingBankAccount === bankAccount)
        const { error: getBankError, result: routingNumberMeta  } = await getBankInfo(routingNumber)
        const { error: getOrganizationError, result: tinMeta } = await getOrganizationInfo(tin)
        if (isInfrastructureError(getBankError)) throw getBankError
        if (isInfrastructureError(getOrganizationError)) throw getOrganizationError
        if (getBankError) {
            return { error: { ...ERRORS.BANK_FOUND_ERROR, messageInterpolation: { routingNumber } } }
        }
        if (getOrganizationError) {
            return { error: { ...ERRORS.ORGANIZATION_FOUND_ERROR, messageInterpolation: { tin } } }
        }
        const bankName = get(routingNumberMeta, 'bankName', get(existingRecipient, 'bankName', null))
        const offsettingAccount = get(routingNumberMeta, 'offsettingAccount', get(existingRecipient, 'offsettingAccount', null))
        const name = get(tinMeta, 'name', get(existingRecipient, 'name', null))
        const iec = get(tinMeta, 'iec', get(existingRecipient, 'iec', null))
        const territoryCode = get(tinMeta, 'territoryCode', get(existingRecipient, 'territoryCode', null))
        const data = { context: this.billingContext.id, name, iec, tin, bankAccount, bankName, bic: routingNumber, offsettingAccount, territoryCode }

        return { existingRecipient, data }
    }

    async saveReceiver ({ existingRecipient, data }) {
        const { error, id, isApproved } = await this.syncBillingRecipient(existingRecipient, data)
        if (error) {
            return { error }
        }
        // TODO(dkovyazin): DOMA-7656 Remove after removing recipient field from BillingReceipt
        // IEC is an optional field as it identifies company branch and is null for individual entrepreneur
        // For Budgetary organizations there is no offsettingAccount and they have there own accounts starting from 03
        // For some organizations there is no information about territoryCode
        const recipient = Object.fromEntries(
            Object.entries(
                {
                    name: data.name,
                    bankName: data.bankName,
                    territoryCode: data.territoryCode,
                    offsettingAccount: data.offsettingAccount,
                    tin: data.tin,
                    iec: data.iec,
                    bic: data.bic,
                    bankAccount: data.bankAccount,
                }
            ).filter(([, value]) => !!value)
        )
        if (!isApproved) {
            return { problem: RECIPIENT_IS_NOT_APPROVED, result: { id, recipient } }
        }
        return { result: { id, recipient } }
    }
    async processReceipts (receiptIndex) {
        const receiverPrepareResult = {}
        const receiverSyncResult = {}
        for (const receipt of Object.values(receiptIndex)) {
            const { tin, routingNumber, bankAccount } = receipt
            if (!receiverPrepareResult[bankAccount]) {
                receiverPrepareResult[bankAccount] = await this.prepareReceiver({ tin, routingNumber, bankAccount })
            }
        }
        for (const [bankAccount, preparedReceiver] of Object.entries(receiverPrepareResult)) {
            receiverSyncResult[bankAccount] = preparedReceiver.error
                ? preparedReceiver
                : await this.saveReceiver(preparedReceiver)
        }
        for (const [index, receipt] of Object.entries(receiptIndex)) {
            const { tin, routingNumber, bankAccount } = receipt
            const { error, problem, result } = receiverSyncResult[receipt.bankAccount]
            if (error) {
                receiptIndex[index].error = this.error(error, index, null, error.messageInterpolation)
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
