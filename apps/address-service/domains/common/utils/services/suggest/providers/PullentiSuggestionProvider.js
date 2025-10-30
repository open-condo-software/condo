const uniqBy = require('lodash/uniqBy')

const { createInstance } = require('@open-condo/clients/pullenti-client')

const { PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { getXmlParser, normalize } = require('@address-service/domains/common/utils/services/utils/pullenti/normalizer')
const { maybeBoostQueryWithTin } = require('@address-service/domains/common/utils/services/utils/pullenti/queryBooster')

const { AbstractSuggestionProvider } = require('./AbstractSuggestionProvider')


/**
 * TODO (DOMA-11991)
 * ⚠️ Pullenti provider still in beta. Normalized result may differ from dadata. Use only for GUID searching.
 */

const DEFAULT_COUNT = 20
const SEARCH_COEF_THRESHOLD = 90

class PullentiSuggestionProvider extends AbstractSuggestionProvider {
    /**
     * @param {ProviderDetectorArgs} args
     */
    constructor (args) {
        super(args)

        this.pullentiClient = createInstance()
        this.xmlParser = getXmlParser()
    }

    getProviderName () {
        return PULLENTI_PROVIDER
    }

    async get ({ query, context = '', count = SEARCH_COEF_THRESHOLD, helpers = {} }) {
        const { tin = null } = helpers

        if (tin) {
            query = await maybeBoostQueryWithTin(query, tin, this.req)
        }

        const xmlResult = await this.pullentiClient.searchByText(query, { count: count || DEFAULT_COUNT })
        const jsonResult = this.xmlParser.parse(xmlResult)
        if (!jsonResult?.searchresult?.gar) {
            return []
        }

        let gars = jsonResult?.searchresult?.gar || []
        gars = Array.isArray(gars) ? gars : [gars]

        const xmlResults = await Promise.all(gars.map((gar) => {
            return gar && gar.path ? this.pullentiClient.processAddress(gar.path) : null
        }))

        return xmlResults
    }

    /**
     * Normalizes an array of XML strings by parsing them and filtering out invalid entries.
     * @param {string[]} xmlStrings
     * @returns 
     */
    normalize (xmlStrings) {
        const norm = []
        for (const xmlString of xmlStrings) {
            const normalized = normalize(xmlString)
            norm.push(normalized)
        }

        const uniqNorm = uniqBy(norm.filter(Boolean), (item) => item.value)

        return uniqNorm
    }
}

module.exports = { PullentiSuggestionProvider }
