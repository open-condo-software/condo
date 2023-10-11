const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')

const SYMBOLS_TO_REMOVE_REGEXP = /[!@#$%^&*)(+=_:"'`[\]]/g
const SPLITTERS_REGEXP = /[,;. -/]/
const IS_DIGITS_ONLY_REGEXP = /^\d+$/

/**
 * @param {string} addressStr
 * @returns {string[]}
 */
function tokenifyAddress (addressStr) {
    return addressStr
        .toLowerCase()
        .replace(SYMBOLS_TO_REMOVE_REGEXP, '')
        .split(SPLITTERS_REGEXP)
        .filter(Boolean)
        .filter((x) => x.length > 1 || IS_DIGITS_ONLY_REGEXP.test(x))
}

/**
 * @param {string[]} arr1
 * @param {string[]} arr2
 * @returns {string[]}
 */
function orderedIntersection (arr1, arr2) {
    const result = []
    const _arr2 = Array.from(arr2) // to keep arr2 untouchable

    for (const str1 of arr1) {
        if (_arr2.includes(str1)) {
            result.push(str1)
            _arr2.splice(0, _arr2.indexOf(str1) + 1)
        }
    }

    return result
}

/**
 * @param {*} context
 * @param {string} organizationId
 * @param {string} address
 *
 * @returns {[Property[], number]} The most probably property and score (percent of matched tokens)
 */
async function findPropertyByOrganizationAndAddress (context, organizationId, address) {
    const targetTokens = tokenifyAddress(address)

    let theMostProbablyProperties = []
    let maxScore = 0

    await loadListByChunks({
        context,
        list: Property,
        where: { organization: { id: organizationId }, deletedAt: null },
        chunkSize: 50,
        chunkProcessor: (/** @type {Property[]} */ chunk) => {
            for (const property of chunk) {
                const tokens = tokenifyAddress(property.address)
                const score = 100 / targetTokens.length * orderedIntersection(targetTokens, tokens).length
                if (score >= maxScore) {
                    if (score === maxScore) {
                        theMostProbablyProperties.push(property)
                    } else {
                        theMostProbablyProperties = [property]
                        maxScore = score
                    }
                }
            }

            return []
        },
    })

    return [theMostProbablyProperties, Number(maxScore.toFixed(2))]
}

module.exports = { findPropertyByOrganizationAndAddress, tokenifyAddress, orderedIntersection }
