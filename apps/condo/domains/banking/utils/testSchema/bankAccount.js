const faker = require('faker')

const { getTinControlSumRU } = require('@condo/domains/banking/utils/validate/tin.utils')
const { RU_NUMBER_WEIGHTS } = require('@condo/domains/banking/utils/validate/constants')

function getRange (length) {
    return ({ min: Math.pow(10,length - 1), max: Math.pow(10, length) - 1 })
}

function createValidRuBankAccount (extra = {}) {
    const tin = createValidRuTin10()
    const routingNumber = createValidRuRoutingNumber()
    const number = createValidRuNumber(routingNumber)

    const validRUBankAccount = {
        tin,
        country: 'ru',
        routingNumber,
        number,
        bankName: faker.company.companyName(),
        currencyCode: 'RUB',
        territoryCode: faker.datatype.number().toString(),
    }
    return {
        ...validRUBankAccount,
        ...extra,
    }
}

function createValidRuNumber (routingNumber) {
    const number = faker.finance.account(19).toString()

    const controlString = routingNumber.substr(-3) + number

    let controlSum = 0

    for (const i in controlString) {
        controlSum = (controlSum + (RU_NUMBER_WEIGHTS[i] * controlString[i])) % 10
    }

    const lastNumber = controlSum ?  (10 - controlSum) : controlSum

    return number + lastNumber
}

function createValidRuRoutingNumber () {
    return '04' + faker.datatype.number(getRange(7)).toString()
}

function createValidRuTin10 () {
    const tin = faker.datatype.number(getRange(10)).toString()

    const lastNumber = getTinControlSumRU(tin)

    return tin.replace(/.$/, lastNumber)
}

function createValidRuTin12 () {
    const tin = faker.datatype.number(getRange(11)).toString()

    const penultNumber = getTinControlSumRU(tin)
    const lastNumber = getTinControlSumRU(tin + penultNumber)

    return tin.replace(/.$/, penultNumber) + lastNumber
}


module.exports = {
    createValidRuBankAccount,
    createValidRuNumber,
    createValidRuRoutingNumber,
    createValidRuTin10,
    createValidRuTin12,
}
