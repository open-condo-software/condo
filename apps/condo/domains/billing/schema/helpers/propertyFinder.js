const { intersection } = require('lodash')

const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')

const SYMBOLS_TO_REMOVE_REGEXP = /[!@#$%^&*)(+=_:"'`[\]]/g
const SPLITTERS_REGEXP = /[,;. ]/

/**
 * @param {string} addressStr
 * @returns {string[]}
 */
function tokenifyAddress (addressStr) {
    return addressStr
        .replace(SYMBOLS_TO_REMOVE_REGEXP, '')
        .split(SPLITTERS_REGEXP)
        .filter(Boolean)
        .filter((x) => x.length > 1)
}

/**
 * @param {*} context
 * @param {string} organizationId
 * @param {string} address
 *
 * @returns {Property}
 */
async function findPropertyByOrganizationAndAddress (context, organizationId, address) {
    const targetTokens = tokenifyAddress(address)

    let theMostProbablyProperty
    let maxScore = 0

    await loadListByChunks({
        context,
        list: Property,
        where: { organization: { id: organizationId }, deletedAt: null },
        chunkSize: 50,
        chunkProcessor: (/** @type {Property[]} */ chunk) => {
            for (const property of chunk) {
                const tokens = tokenifyAddress(property.address)
                const score = 100 / targetTokens.length * intersection(targetTokens, tokens).length
                if (score > maxScore) {
                    theMostProbablyProperty = property
                    maxScore = score
                }
            }

            return []
        },
    })

    return [theMostProbablyProperty, Number(maxScore.toFixed(2))]
}

module.exports = { findPropertyByOrganizationAndAddress, tokenifyAddress }
