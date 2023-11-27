// ELS is a 10-digit code, where 3 and 4 characters are russian letters and the rest are numbers.
const IS_ELS_REGEXP = /^\d{2}[А-Я]{2}\d{6}$/i

const { isEmpty, isNil } = require('lodash')

const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')
const { find } = require('@open-condo/keystone/schema')

const { BILLING_ACCOUNT_OWNER_TYPE_COMPANY, BILLING_ACCOUNT_OWNER_TYPE_PERSON } = require('@condo/domains/billing/constants/constants')
const { Resolver } = require('@condo/domains/billing/schema/resolvers/resolver')

const BILLING_ACCOUNT_FIELDS = '{ id  }'
const BillingAccountGQL = generateGqlQueries('BillingAccount', BILLING_ACCOUNT_FIELDS)
const BillingAccountApi = generateServerUtils(BillingAccountGQL)

const REMOVE_NOT_USED_WORDS_REGEXP = /(л\/с|лс|№)/gi

class AccountResolver extends Resolver {
    constructor ({ billingContext, context }) {
        super(billingContext, context, { name: 'account' })
        this.recipients = []
        this.accountsByReceiptByImportId = {}
    }

    replaceSameEnglishLetters (input) {
        const replacements = {
            'a': 'а', 'b': 'б', 'c': 'с', 'e': 'е', 'h': 'н', 'k': 'к', 'm': 'м',
            'o': 'о', 'p': 'р', 't': 'т', 'x': 'х', 'y': 'у',
        }
        return input.replace(/[a-zA-Z]/g, (match) => {
            const replacement = replacements[match.toLowerCase()]
            if (replacement) {
                if (match === match.toUpperCase()) {
                    return replacement.toUpperCase()
                }
                return replacement
            }
            return match
        })
    }
    isPerson (fullName) {
        const FIO_REGEXP = /^[А-ЯЁ][а-яё]*([-' .][А-ЯЁ][а-яё]*){0,2}\s+[IVА-ЯЁ][a-zа-яё.]*([- .'ёЁ][IVА-ЯЁ][a-zа-яё.]*)*$/
        const ENDINGS = 'оглы|кызы' // могут присутствовать в конце ФИО
        let [input] = fullName.split(new RegExp(`\\s(${ENDINGS})$`))
        input = this.replaceSameEnglishLetters(input).replace(/([А-ЯЁ])([А-ЯЁ]+)/gu,
            (match, firstChar, restOfString) => firstChar + restOfString.toLowerCase()
        )
        return FIO_REGEXP.test(input)
    }

    async init () {
        this.accounts = await find('BillingAccount', { context: { id: this.billingContext.id }, deletedAt: null })
    }

    clearInput (accountNumber) {
        return String(accountNumber).replace(REMOVE_NOT_USED_WORDS_REGEXP, '').trim()
    }

    // If receipt input has importId from integration - then connected account will not be created
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
            const { unitName, unitType } = receipt.addressResolve
            let { accountNumber, accountMeta = {} } = receipt
            let { globalId, importId, fullName, isClosed, ownerType } = accountMeta
            if (fullName && isNil(ownerType)) {
                ownerType = this.isPerson(fullName) ? BILLING_ACCOUNT_OWNER_TYPE_PERSON : BILLING_ACCOUNT_OWNER_TYPE_COMPANY
            }
            accountNumber = this.clearInput(accountNumber)
            if (globalId && !IS_ELS_REGEXP.test(globalId)) {
                globalId = ''
            }
            let existingAccount
            if (receipt.importId && this.accountsByReceiptByImportId[receipt.importId]) {
                existingAccount = this.accounts.find(({ id }) => this.accountsByReceiptByImportId[receipt.importId] === id)
            }
            if (importId && !existingAccount) {
                existingAccount = this.accounts.find(({ importId: accountImportId }) => accountImportId === importId)
            }
            if (!existingAccount) {
                existingAccount = this.accounts.find(({ number, property }) => number === accountNumber && receipt.property === property)
            }
            if (existingAccount) {
                const updateInput = {
                    ...(accountNumber !== existingAccount.number) ? { number: accountNumber } : {},
                    ...(receipt.property !== existingAccount.property) ? { property: { connect: { id: receipt.property } } } : {},
                    ...(globalId && globalId !== existingAccount.globalId) ? { globalId } : {},
                    ...(importId && existingAccount.importId !== importId) ? { importId } : {},
                    ...(fullName && existingAccount.fullName !== fullName) ? { fullName } : {},
                    ...(!isNil(isClosed) && existingAccount.isClosed !== isClosed) ? { isClosed } : {},
                    ...(ownerType && existingAccount.ownerType !== ownerType) ? { ownerType } : {},
                    ...(existingAccount.unitName !== unitName) ? { unitName } : {},
                    ...(existingAccount.unitType !== unitType) ? { unitType } : {},
                }
                if (!isEmpty(updateInput)) {
                    this.updated++
                    await BillingAccountApi.update(this.context, existingAccount.id, {
                        ...this.dvSender,
                        ...updateInput,
                    })
                } else {
                    this.unTouched++
                }
                receiptIndex[index].account = existingAccount.id
            } else {
                const createInput = {
                    ...this.dvSender,
                    number: accountNumber,
                    context: { connect: { id: this.billingContext.id } },
                    property: { connect: { id: receipt.property } },
                    unitName,
                    unitType,
                    ...globalId ? { globalId } : {},
                    ...importId ? { importId } : {},
                    ...fullName ? { fullName } : {},
                    ...!isNil(isClosed) ? { isClosed } : {},
                    ...ownerType ? { ownerType } : {},
                }
                this.created++
                const { id }  = await BillingAccountApi.create(this.context, createInput)
                receiptIndex[index].account = id
            }
        }
        return this.result(receiptIndex)
    }

}

module.exports = {
    AccountResolver,
}