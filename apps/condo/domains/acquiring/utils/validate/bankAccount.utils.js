const { validateBic } = require('@condo/domains/acquiring/utils/validate/bic.utils')

const EMPTY = 'Bank account is empty'
const NOT_NUMERIC = 'Bank account can contain only numeric digits'
const WRONG_LENGTH = 'Bank account length was expected to be 20, but received '
const CONTROL_SUM_FAILED = 'Control sum is not valid for bank account'


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
        let checksum = 0
        const weights = [7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1]

        for (const i in weights) {
            checksum += weights[i] * (controlString[i] % 10)
        }

        if (checksum % 10 !== 0) {
            this.errors.push(CONTROL_SUM_FAILED)
        }

        return {
            result: !this.errors.length,
            errors: this.errors,
        }
    }

}

const validateBankAccount = (bankAccount, bic) => {
    const validator = new RecipientBankAccountValidation()
    const { result, errors } = validator.validateBankAccount(bankAccount, bic)
    return { result, errors }
}

module.exports = {
    validateBankAccount,
}

