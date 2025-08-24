const get = require('lodash/get')

const { createInstance } = require('@open-condo/clients/pullenti-client')

const { DadataSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers/DadataSuggestionProvider')
const { getXmlParser } = require('@address-service/domains/common/utils/services/utils/pullenti/normalizer')

const ORGANIZATION_KLADR_FIELDS = ['settlement_kladr_id', 'city_kladr_id', 'region_kladr_id']

/**
 * Boosts the client's query with the organization's TIN
 * @param {string} query the client's query
 * @param {string} tin the organization's TIN
 * @returns {string} extended query
 */
async function maybeBoostQueryWithTin (query, tin, req) {
    const dadataSuggestionProvider = new DadataSuggestionProvider({ req })
    const organizationInfo = await dadataSuggestionProvider.getOrganization(tin)

    if (organizationInfo) {
        const closestKladrCode = ORGANIZATION_KLADR_FIELDS
            .map(fieldName => get(organizationInfo, `data.address.data.${fieldName}`))
            ?.filter(Boolean)
            ?.map((kladr_id) => kladr_id)[0]
            || null

        if (closestKladrCode) {
            const client = createInstance()
            const garByKladrXml = await client.searchByParam('kladrcode', closestKladrCode)

            if (garByKladrXml) {
                const xmlParser = getXmlParser()
                const garByKladrJson = xmlParser.parse(garByKladrXml)
                const path = garByKladrJson?.searchresult?.gar?.path
                if (path) {
                    return `${path}, ${query}`
                }
            }
        }
    }

    return query
}

module.exports = { maybeBoostQueryWithTin }
