const { isEmpty, get } = require('lodash')

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
    if (isEmpty(conf['ADDRESS_SUGGESTIONS_CONFIG'])  || get(conf, 'ADDRESS_SERVICE_CLIENT_MODE') === 'fake') {
        if (!tin || tin === '00000000') {
            return { error: true }
        }

        return {
            result: {
                name: `Company ${tin}`,
                timezone: 'Asia/Yakutsk',
                territoryCode: tin,
                iec: tin,
                tin,
                psrn: tin,
                country: 'en',
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
    if (isEmpty(conf['ADDRESS_SUGGESTIONS_CONFIG']) || get(conf, 'ADDRESS_SERVICE_CLIENT_MODE') === 'fake') {
        if (!routingNumber || routingNumber === '00000000') {
            return { error: true }
        }

        return {
            result: {
                routingNumber,
                bankName: `Bank for ${routingNumber}`,
                offsettingAccount: routingNumber,
                territoryCode: routingNumber,
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
