const { FinanceInfoClient } = require('./FinanceInfoClient')

/**
 * Get organization details by Taxpayer Identification Number (TIN).
 * @async
 * @param {string} tin - The Taxpayer Identification Number (TIN) to look up.
 * @returns {Error} returns.error
 * @returns {string} returns.result.timezone - The timezone of the organization.
 * @returns {string} returns.result.territoryCode - The territory code of the organization.
 * @returns {string} returns.result.iec - The IEC (KPP) of the organization.
 * @returns {string} returns.result.tin - The TIN (INN) of the organization.
 * @returns {string} returns.result.psrn - Primary State Registration Number (OGRN)
 * @returns {string} returns.result.name - The name of the organization (either short name or full name).
 * @returns {string} returns.result.country - The lowercase country code of the organization.
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
 * @return {Error} returns.error
 * @returns {string} returns.result.routingNumber - The Bank Identification Code (BIC).
 * @returns {string} returns.result.bankName - The name of the bank.
 * @returns {string} returns.result.offsettingAccount - The correspondent account of the bank.
 * @returns {string} returns.result.territoryCode - The territory code of the bank.
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

module.exports = {
    getOrganizationInfo,
    getBankInfo,
}