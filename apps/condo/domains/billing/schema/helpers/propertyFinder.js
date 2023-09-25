const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')

/**
 * @param {string} addressStr 
 * @returns {string[]}
 */
function tokenifyAddress (addressStr) {
    return addressStr
        .replace(/[!@#$%^&*)(+=,_:;"'`[\]]/g, '')
        .split(/[. ]/)
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
    return address

    //
    // TODO
    //

    // const targetTokens = tokenifyAddress(address)

    // let theMostProbablyProperty

    // await loadListByChunks({
    //     context,
    //     list: Property,
    //     where: { organization: { id: organizationId }, deletedAt: null },
    //     chunkSize: 50,
    //     chunkProcessor: (/** @type {Property[]} */ chunk) => {
    //         for (const property of chunk) {
    //             const tokens = tokenifyAddress(property.address)
    //         }

    //         return []
    //     },
    // })
}

module.exports = { findPropertyByOrganizationAndAddress }
