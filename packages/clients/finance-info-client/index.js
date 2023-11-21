const { faker } = require('@faker-js/faker')

const conf = require('@open-condo/config')

const { FinanceInfoClient } = require('./FinanceInfoClient')

/**
 * @typedef {Object} BankInfoResult
 * @property {Error} error
 * @property {BankInfo} result
 */

/**
 * @typedef {Object} OrganizationInfoResult
 * @property {Error} error
 * @property {OrganizationInfo} result
 */

/**
 * Get organization details by Taxpayer Identification Number (TIN).
 * @async
 * @param {string} tin - The Taxpayer Identification Number (TIN) to look up.
 * @returns {OrganizationInfoResult}
 */
async function getOrganizationInfo (tin) {
    if (conf.NODE_ENV === 'test') {
        if (!tin || tin === '00000000') {
            return { error: true }
        }

        return {
            result: {
                name: faker.company.name(),
                timezone: faker.address.timeZone(),
                territoryCode: faker.address.countryCode(),
                iec: faker.finance.account(),
                tin,
                psrnname: faker.finance.account(),
                country: faker.address.country(),
            },
        }
    }

    const client = new FinanceInfoClient()
    try {
        const result = await client.getOrganization(tin)
        return { error: null, result }
    } catch (error) {
        return { error: error }
    }
}

/**
 * Get bank details by Bank Identification Code (BIC).
 * @async
 * @param {string} routingNumber - The Bank Identification Code (BIC) to look up.
 * @return {BankInfoResult}
 */
async function getBankInfo (routingNumber) {
    if (conf.NODE_ENV === 'test') {
        if (!routingNumber || routingNumber === '00000000') {
            return { error: true }
        }

        return {
            result: {
                routingNumber,
                bankName: faker.random.words(2),
                offsettingAccount: faker.finance.account(),
                territoryCode: faker.address.countryCode(),
            },
        }
    }

    const client = new FinanceInfoClient()
    try {
        const result = await client.getBank(routingNumber)
        return { error: null, result }
    } catch (error) {
        return { error: error }
    }
}

module.exports = {
    getOrganizationInfo,
    getBankInfo,
}
