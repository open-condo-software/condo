const get = require('lodash/get')

const conf = require('@open-condo/config')

const { getBankInfo: fakeGetBankInfo, getOrganizationInfo: fakeGetOrganizationInfo } = require('./FakeFinanceInfoClient')
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
    const client = new FinanceInfoClient()
    try {
        const result = await client.getBank(routingNumber)
        return { error: null, result }
    } catch (error) {
        return { error: error }
    }
}

if (get(conf, 'FAKE_FINANCE_INFO_CLIENT') === 'true') {
    console.log('🥸 The fake FinanceInfoClient is used.')
    module.exports = {
        getOrganizationInfo: fakeGetOrganizationInfo,
        getBankInfo: fakeGetBankInfo,
    }
} else {
    module.exports = {
        getOrganizationInfo,
        getBankInfo,
    }
}
