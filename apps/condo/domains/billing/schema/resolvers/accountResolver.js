// ELS is a 10-digit code, where 3 and 4 characters are russian letters and the rest are numbers.
const IS_ELS_REGEXP = /^\d{2}[А-ЯЁ]{2}\d{6}(?:-[^-\s]+)*$/i

const { itemsQuery } = require('@open-condo/keystone/schema')

const { BILLING_ACCOUNT_OWNER_TYPE_COMPANY, BILLING_ACCOUNT_OWNER_TYPE_PERSON } = require('@condo/domains/billing/constants/constants')
const {
    ERRORS,
} = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { createStageContext, forEachSequential, isObjectEmpty } = require('@condo/domains/billing/schema/resolvers/resolver')
const { clearAccountNumber, isPerson } = require('@condo/domains/billing/schema/resolvers/utils')
const { BillingAccount } = require('@condo/domains/billing/utils/serverSchema')

async function loadExistingAccounts (receiptIndex, billingContextId) {
    const accountNumbers = [...new Set(Object.values(receiptIndex).map(({ accountNumber }) => clearAccountNumber(accountNumber)))]
    if (!accountNumbers.length) return new Map()

    const accounts = await itemsQuery('BillingAccount', {
        where: {
            number_in: accountNumbers,
            deletedAt: null,
            context: { id: billingContextId },
        },
        sortBy: ['createdAt_ASC', 'id_ASC'],
    })
    const accountsByNumber = new Map()
    for (const account of accounts) {
        if (!accountsByNumber.has(account.number)) accountsByNumber.set(account.number, account)
    }
    return accountsByNumber
}

async function resolveAccounts (receiptIndex, { billingContext, context }) {
    const stage = createStageContext({ name: 'account', context })
    const accountsByNumber = await loadExistingAccounts(receiptIndex, billingContext.id)
    await forEachSequential(Object.entries(receiptIndex), async ([index, receipt]) => {
        const { unitName, unitType } = receipt.addressResolve
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
        const accountData = {
            number: accountNumber, unitName, unitType, property: receipt.property,
            globalId, importId,
            fullName, isClosed, ownerType,
        }
        const existingAccount = accountsByNumber.get(accountNumber)
        if (existingAccount) {
            const updateInput = stage.buildUpdateInput(accountData, existingAccount, ['property'], { allowNull: true })
            let accountForCache = existingAccount
            if (!isObjectEmpty(updateInput)) {
                try {
                    // Receipts sharing an account must update it in input order.
                    await BillingAccount.update(context, existingAccount.id, updateInput)
                    stage.markUpdated()
                    accountForCache = {
                        ...existingAccount,
                        ...Object.fromEntries(Object.entries(accountData).filter(([, value]) => value !== undefined)),
                    }
                } catch (error) {
                    receiptIndex[index].error = stage.error(ERRORS.ACCOUNT_SAVE_FAILED, index, error, { accountNumber })
                }
            } else {
                stage.markUntouched()
            }
            receiptIndex[index].account = existingAccount.id
            accountsByNumber.set(accountNumber, accountForCache)
        } else {
            try {
                // Receipts sharing an account must create/cache it before the next item.
                const { id } = await BillingAccount.create(context, stage.buildCreateInput({
                    ...accountData,
                    context: billingContext.id,
                }, ['context', 'property']))
                stage.markCreated()
                receiptIndex[index].account = id
                accountsByNumber.set(accountNumber, { id, ...accountData })
            } catch (error) {
                receiptIndex[index].error = stage.error(ERRORS.ACCOUNT_SAVE_FAILED, index, error, { accountNumber })
            }
        }
    })
    return stage.result(receiptIndex)
}

module.exports = {
    resolveAccounts,
}
