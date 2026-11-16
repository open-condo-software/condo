// ELS is a 10-digit code, where 3 and 4 characters are russian letters and the rest are numbers.
const IS_ELS_REGEXP = /^\d{2}[А-ЯЁ]{2}\d{6}(?:-[^-\s]+)*$/i

const { isEmpty, isNil } = require('lodash')

const { find } = require('@open-condo/keystone/schema')

const { BILLING_ACCOUNT_OWNER_TYPE_COMPANY, BILLING_ACCOUNT_OWNER_TYPE_PERSON } = require('@condo/domains/billing/constants/constants')
const {
    ERRORS,
} = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { Resolver } = require('@condo/domains/billing/schema/resolvers/resolver')
const { clearAccountNumber, isPerson } = require('@condo/domains/billing/schema/resolvers/utils')
const { BillingAccount } = require('@condo/domains/billing/utils/serverSchema')


class AccountResolver extends Resolver {
    constructor ({ billingContext, context }) {
        super(billingContext, context, { name: 'account' })
        this.recipients = []
        this.accountsByReceiptByImportId = {}
        this.accountsByNumber = new Map()
    }

    async init () {
        //this.accounts = await find('BillingAccount', { context: { id: this.billingContext.id }, deletedAt: null })
    }

    async getBillingAccount (where = {}) {
        const [account] = await find('BillingAccount', { ...where, deletedAt: null, context: { id: this.billingContext.id } })
        return account
    }

    // If receipt input has importId from integration - then connected account will not be created, only updated
    async createIndexByImportId (receiptIndex) {
        const receiptImportIds = []
        for (const [,receipt] of Object.entries(receiptIndex)) {
            if (receipt.importId) {
                receiptImportIds.push(receipt.importId)
            }
        }
        if (receiptImportIds.length) {
            const receipts = await find('BillingReceipt', { importId_in: receiptImportIds, deletedAt: null, context: { id: this.billingContext.id } })
            this.accountsByReceiptByImportId = Object.fromEntries(receipts.map(({ importId, account }) => ([importId, account])))
        }
    }

    async processReceipts (receiptIndex) {
        await this.createIndexByImportId(receiptIndex)
        for (const [index, receipt] of Object.entries(receiptIndex)) {
            let { unitName, unitType } = receipt.addressResolve
            let { accountNumber, accountMeta = {} } = receipt
            let { globalId, importId, fullName, isClosed, ownerType } = accountMeta
            if (fullName && isNil(ownerType)) {
                ownerType = isPerson(fullName) ? BILLING_ACCOUNT_OWNER_TYPE_PERSON : BILLING_ACCOUNT_OWNER_TYPE_COMPANY
            }
            accountNumber = clearAccountNumber(accountNumber)
            if (globalId !== null && globalId !== undefined && !IS_ELS_REGEXP.test(globalId)) {
                globalId = undefined
            }
            let existingAccount = this.accountsByNumber.get(accountNumber)
            if (receipt.importId && this.accountsByReceiptByImportId[receipt.importId]) {
                existingAccount = await this.getBillingAccount({ id: this.accountsByReceiptByImportId[receipt.importId] })
            }
            if (!existingAccount) {
                existingAccount = await this.getBillingAccount({ number: accountNumber })
            }
            if (existingAccount) {
                const updateInput = this.buildUpdateInput({
                    number: accountNumber, unitName, unitType, property: receipt.property,
                    globalId, importId,
                    fullName, isClosed, ownerType }, existingAccount, ['property'], { allowNull: true })
                if (!isEmpty(updateInput)) {
                    try {
                        await BillingAccount.update(this.context, existingAccount.id, updateInput)
                    } catch (error) {
                        receiptIndex[index].error = this.error(ERRORS.ACCOUNT_SAVE_FAILED, index, error, { accountNumber })
                    }
                }
                receiptIndex[index].account = existingAccount.id
                this.accountsByNumber.set(accountNumber, { ...existingAccount, property: receipt.property, unitName, unitType, globalId, importId, fullName, isClosed, ownerType })
            } else {
                try {
                    const { id }  = await BillingAccount.create(this.context, this.buildCreateInput({
                        number: accountNumber, unitName, unitType, context: this.billingContext.id, property: receipt.property,
                        globalId, importId,
                        fullName, isClosed, ownerType,
                    }, ['context', 'property']))
                    receiptIndex[index].account = id
                    this.accountsByNumber.set(accountNumber, { id, number: accountNumber, property: receipt.property, unitName, unitType, globalId, importId, fullName, isClosed, ownerType })
                } catch (error) {
                    receiptIndex[index].error = this.error(ERRORS.ACCOUNT_SAVE_FAILED, index, error, { accountNumber })
                }
            }
        }
        return this.result(receiptIndex)
    }

}

module.exports = {
    AccountResolver,
}
