const faker = require('faker')

const { getTinControlSumRU } = require('@condo/domains/acquiring/utils/validate/tin.utils')
const { BANK_ACCOUNT_WEIGHTS } = require('@condo/domains/acquiring/utils/validate/bankAccount.utils')


function createValidRecipient (extra = {}) {
    const range = (length) => ({ min: Math.pow(10,length - 1), max: Math.pow(10,length)-1 })

    const bic = createValidRuBic()
    const bankAccount = createValidBankAccount(bic)
    const tin = createValidTin()

    const validRecipient = {
        name: faker.company.companyName(),
        tin,
        iec: faker.datatype.number(range(9)).toString(),
        bic,
        bankAccount,
        bankName: faker.company.companyName(),
        territoryCode: faker.datatype.number().toString(),
        offsettingAccount: faker.finance.account(20).toString(),
    }
    return {
        ...validRecipient,
        ...extra,
    }
}

function createValidBankAccount (bic) {
    const bankAccount = faker.finance.account(19).toString()

    const controlString = bic.substr(-3) + bankAccount

    let controlSum = 0

    for (const i in controlString) {
        controlSum = (controlSum + (BANK_ACCOUNT_WEIGHTS[i] * controlString[i])) % 10
    }

    const lastNumber = controlSum ?  (10 - controlSum) : controlSum

    return bankAccount + lastNumber
}

function createValidRuBic () {
    return '04' + faker.datatype.number({ min: 1000000, max: 9999999 }).toString()
}

function createValidTin () {
    const tin = faker.datatype.number({
        min: Math.pow(10, 9),
        max: Math.pow(10, 10) - 1,
    }).toString()

    const lastNumber = getTinControlSumRU(tin)

    return tin.replace(/.$/, lastNumber)
}


module.exports = {
    createValidRecipient,
    createValidBankAccount,
    createValidRuBic,
    createValidTin,
}
