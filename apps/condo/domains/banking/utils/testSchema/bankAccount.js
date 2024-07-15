const { faker } = require('@faker-js/faker')

const {
    RU_NUMBER_WEIGHTS,
    getRuTinControlSum,
} = require('@condo/domains/banking/utils/validate/countrySpecificValidators/ru.validator')
const dayjs = require('dayjs')
const {
    createTestBankIntegrationAccountContext,
    createTestBankAccount,
    createTestBankCostItem,
    createTestBankContractorAccount,
    createTestBankTransaction,
} = require('./index')


function getRange (length) {
    return ({ min: Math.pow(10, length - 1), max: Math.pow(10, length) - 1 })
}

function bulidValidRequisitesForRuBankAccount (extra = {}) {
    const tin = createValidRuTin10()
    const routingNumber = createValidRuRoutingNumber()
    const number = createValidRuNumber(routingNumber)
    const classificationCode = createValidRuClassificationCode()

    const validRUBankAccount = {
        tin,
        country: 'ru',
        routingNumber,
        number,
        bankName: faker.company.name(),
        currencyCode: 'RUB',
        territoryCode: faker.datatype.number().toString(),
        classificationCode,
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

    const lastNumber = controlSum ? (10 - controlSum) : controlSum

    return number + lastNumber
}

function createValidRuRoutingNumber () {
    return '04' + faker.datatype.number(getRange(7)).toString()
}

function createValidRuClassificationCode () {
    return faker.datatype.number(getRange(20)).toString()
}

function createValidRuTin10 () {
    const tin = faker.datatype.number(getRange(10)).toString()

    const lastNumber = getRuTinControlSum(tin)

    return tin.replace(/.$/, lastNumber)
}

function createValidRuTin12 () {
    const tin = faker.datatype.number(getRange(11)).toString()

    const penultNumber = getRuTinControlSum(tin)
    const lastNumber = getRuTinControlSum(tin + penultNumber)

    return tin.replace(/.$/, penultNumber) + lastNumber
}

const makeBankAccountWithData = async (client, o10n, bankIntegration, category) => {
    const currentDate = dayjs()
    const formattedCurrentDate = currentDate.format('YYYY-MM-DD')

    const incomeTransactions = 5
    const incomeTransactionAmount = 50
    const totalIncome = incomeTransactions * incomeTransactionAmount

    const outcomeTransactions = 5
    const outcomeTransactionAmount = 10
    const totalOutcome = outcomeTransactions * outcomeTransactionAmount

    const totalAmount = totalIncome - totalOutcome

    const [integrationContext] = await createTestBankIntegrationAccountContext(client, bankIntegration, o10n, {
        meta: {
            amount: String(totalAmount),
            amountAt: formattedCurrentDate,
        },
    })
    const [account] = await createTestBankAccount(client, o10n, {
        integrationContext: { connect: { id: integrationContext.id } },
    })

    const [costItem] = await createTestBankCostItem(client, category, {
        isOutcome: false,
    })

    const [contractorAccount] = await createTestBankContractorAccount(client, o10n, {
        costItem: { connect: { id: costItem.id } },
    })

    for (let i = 0; i < incomeTransactions; i++) {
        await createTestBankTransaction(client, account, contractorAccount, integrationContext, o10n, {
            date: formattedCurrentDate,
            amount: String(incomeTransactionAmount),
            isOutcome: false,
        })

    }
    for (let i = 0; i < outcomeTransactions; i++) {
        await createTestBankTransaction(client, account, { id: faker.datatype.uuid() }, integrationContext, o10n, {
            date: formattedCurrentDate,
            amount: String(outcomeTransactionAmount),
            isOutcome: true,
            contractorAccount: undefined,
        })
    }

    return {
        integrationContext,
        account,
        costItem,
        contractorAccount,
        bankIntegration,
        category,
        formattedCurrentDate,
        totalIncome,
        totalOutcome,
        totalAmount,
    }
}


module.exports = {
    bulidValidRequisitesForRuBankAccount,
    createValidRuNumber,
    createValidRuRoutingNumber,
    createValidRuTin10,
    createValidRuTin12,
    createValidRuClassificationCode,
    makeBankAccountWithData,
}
