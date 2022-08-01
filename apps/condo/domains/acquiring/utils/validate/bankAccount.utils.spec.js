const { SPACE_SYMBOLS, SPACE_SYMBOL_LABLES } = require('@condo/domains/common/utils/string.utils')
const { validateBankAccount } = require('@condo/domains/acquiring/utils/validate/bankAccount.utils')
const { createValidBankAccount } = require('@condo/domains/acquiring/utils/testSchema/recipientGenerate')

const SPACES = SPACE_SYMBOLS.split('')

const VALID_BANK_ACCOUNTS = [
    {
        bankAccount: '40647859100000003330',
        bic: '040033685',
    },
    {
        bankAccount: '50300807000000002104',
        bic: '044712578',
    },
]
const WRONG_LENGTH_BANK_ACCOUNT = '4064785910000000333043'
const WRONG_FORMAT_BANK_ACCOUNT = '4064V85910000D003330'

const INVALID_CONTROL_SUM_BANK_ACCOUNT = {
    bankAccount: '50300807000003002104',
    bic: '044712576',
}

const VALID_RU_BIC = '045809749'

describe('validateBankAccount()', () => {
    VALID_BANK_ACCOUNTS.forEach(data => {
        const { bankAccount, bic } = data

        test(`for valid RU BANK ACCOUNT (${bankAccount})`, () => {
            const { result } = validateBankAccount(bankAccount, bic)
            expect(result).toBe(true)
        })

        SPACES.forEach(spaceSymbol => {
            test(`for valid RU BANK ACCOUNT (${bankAccount}) with spaces symbol (${SPACE_SYMBOL_LABLES[spaceSymbol] || spaceSymbol})`, () => {
                const bankAccountValue = `${spaceSymbol}${bankAccount}${spaceSymbol}`

                const { result } = validateBankAccount(bankAccountValue, bic)
                expect(result).toBe(true)
            })
        })
    })

    test('for wrong length number as RU BANK ACCOUNT', () => {
        const { result, errors } = validateBankAccount(WRONG_LENGTH_BANK_ACCOUNT, VALID_RU_BIC)
        expect(result).toBe(false)
        expect(errors[0]).toBe('Bank account length was expected to be 20, but received 22')
    })
    test('for contains invalid characters as RU BANK ACCOUNT', () => {
        const { result, errors } = validateBankAccount(WRONG_FORMAT_BANK_ACCOUNT, VALID_RU_BIC)
        expect(result).toBe(false)
        expect(errors[0]).toBe('Bank account can contain only numeric digits')
    })
    test('for empty value as RU BANK ACCOUNT', () => {
        const { result, errors } = validateBankAccount('', VALID_RU_BIC)
        expect(result).toBe(false)
        expect(errors[0]).toBe('Bank account is empty')
    })
    test('for invalid control sum as RU BANK ACCOUNT', () => {
        const { bankAccount, bic } = INVALID_CONTROL_SUM_BANK_ACCOUNT
        const { result, errors } = validateBankAccount(bankAccount, bic)
        expect(result).toBe(false)
        expect(errors[0]).toBe('Control sum is not valid for bank account')
    })
    test('for create valid RU BANK ACCOUNT', () => {
        const bankAccount = createValidBankAccount(VALID_RU_BIC)
        const { result } = validateBankAccount(bankAccount, VALID_RU_BIC)
        expect(result).toBe(true)
    })
})

module.exports = {
    VALID_BANK_ACCOUNTS,
    WRONG_LENGTH_BANK_ACCOUNT,
    WRONG_FORMAT_BANK_ACCOUNT,
    INVALID_CONTROL_SUM_BANK_ACCOUNT,
}
