// ELS is a 10-digit code, where 3 and 4 characters are russian letters and the rest are numbers.
const IS_ELS_REGEXP = /^\d{2}[А-ЯЁ]{2}\d{6}(?:-[^-\s]+)*$/i

const isEmpty = require('lodash/isEmpty')

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
        this.accountsByNumber = new Map()
    }

    async getBillingAccount (where = {}) {
        const [account] = await find('BillingAccount', { ...where, deletedAt: null, context: { id: this.billingContext.id } })
        return account
    }

    async processReceipts (receiptIndex) {
        for (const [index, receipt] of Object.entries(receiptIndex)) {
            let { unitName, unitType } = receipt.addressResolve
            let { accountNumber, accountMeta = {} } = receipt
            let { globalId, importId, fullName, isClosed, ownerType } = accountMeta
            if (fullName && ownerType === undefined) {
                ownerType = isPerson(fullName) ? BILLING_ACCOUNT_OWNER_TYPE_PERSON : BILLING_ACCOUNT_OWNER_TYPE_COMPANY
            }
            // Checkbox and Select fields are not nullable in BillingAccount.
            // Null-clearing is supported only for nullable account metadata.
            if (isClosed === null) isClosed = undefined
            if (ownerType === null) ownerType = undefined
            accountNumber = clearAccountNumber(accountNumber)
            if (globalId !== null && globalId !== undefined && !IS_ELS_REGEXP.test(globalId)) {
                globalId = undefined
            }
            let existingAccount = this.accountsByNumber.get(accountNumber)
            if (!existingAccount) {
                existingAccount = await this.getBillingAccount({ number: accountNumber })
            }
            if (existingAccount) {
                const accountData = {
                    number: accountNumber, unitName, unitType, property: receipt.property,
                    globalId, importId,
                    fullName, isClosed, ownerType,
                }
                const updateInput = this.buildUpdateInput(accountData, existingAccount, ['property'], { allowNull: true })
                let accountForCache = existingAccount
                if (!isEmpty(updateInput)) {
                    try {
                        await BillingAccount.update(this.context, existingAccount.id, updateInput)
                        accountForCache = {
                            ...existingAccount,
                            ...Object.fromEntries(Object.entries(accountData).filter(([, value]) => value !== undefined)),
                        }
                    } catch (error) {
                        receiptIndex[index].error = this.error(ERRORS.ACCOUNT_SAVE_FAILED, index, error, { accountNumber })
                    }
                }
                receiptIndex[index].account = existingAccount.id
                this.accountsByNumber.set(accountNumber, accountForCache)
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
