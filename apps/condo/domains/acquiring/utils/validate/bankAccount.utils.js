/*
 * Validator BankAccount
 *
 * You need a BIC for validation
 *
 * The following checks are performed:
 * 1) Сhecking for emptiness
 * 2) Checking for length and format (Consists of 20 digits)
 * 3) Сhecking checksum verification for BankAccount
 */


const faker = require('faker')
const { validateBic } = require('@condo/domains/acquiring/utils/validate/bic.utils')

const EMPTY = 'Bank account is empty'
const NOT_NUMERIC = 'Bank account can contain only numeric digits'
const WRONG_LENGTH = 'Bank account length was expected to be 20, but received '
const CONTROL_SUM_FAILED = 'Control sum is not valid for bank account'

const BANK_ACCOUNT_WEIGHTS = [7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1]


class RecipientBankAccountValidation {

    errors = []

    validateForNumbersAndLength (bankAccount) {
        if (!bankAccount.length) {
            this.errors.push(EMPTY)
        }
        if (/[^0-9]/.test(bankAccount)) {
            this.errors.push(NOT_NUMERIC)
        }
        if (bankAccount.length !== 20) {
            this.errors.push(WRONG_LENGTH + bankAccount.length)
        }
    }

    validateBankAccount (bankAccount, bic) {
        this.errors.push( ...validateBic(bic).errors )

        const bicWithoutSpaces = bic.toString().trim()
        const bankAccountWithoutSpaces = bankAccount.toString().trim()

        this.validateForNumbersAndLength(bankAccountWithoutSpaces)

        const controlString = bicWithoutSpaces.substr(-3) + bankAccountWithoutSpaces

        let controlSum = 0
        for (const i in BANK_ACCOUNT_WEIGHTS) {
            controlSum += (BANK_ACCOUNT_WEIGHTS[i] * controlString[i]) % 10
        }

        if (controlSum % 10 !== 0) {
            this.errors.push(CONTROL_SUM_FAILED)
        }

        return {
            result: !this.errors.length,
            errors: this.errors,
        }
    }

}

function createValidBankAccount (bic) {
    const bankAccount = faker.finance.account(19).toString()

    const controlString = bic.substr(-3) + bankAccount

    let controlSum = 0

    for (const i in controlString) {
        controlSum += (BANK_ACCOUNT_WEIGHTS[i] * controlString[i]) % 10
    }

    const lastNumber = 10 - controlSum % 10

    return bankAccount + lastNumber
}

const validateBankAccount = (bankAccount, bic) => {
    const validator = new RecipientBankAccountValidation()
    const { result, errors } = validator.validateBankAccount(bankAccount, bic)
    return { result, errors }
}

module.exports = {
    createValidBankAccount,
    validateBankAccount,
}

