const isNull = require('lodash/isNull')

class AnalyticsDataProvider {
    constructor (props) {
        this.entities = props.entities
    }

    async loadAll () {
        const result = {}

        for (const [entityName, { provider, queryOptions, remappingOptions = null }] of Object.entries(this.entities)) {
            const providerResult = await provider.get(queryOptions)

            if (!isNull(remappingOptions)) {
                for (const property in providerResult) {
                    providerResult[remappingOptions[property]] = providerResult[property]
                    delete providerResult[property]
                }
            }
            result[entityName] = providerResult
        }

        return result
    }
}

module.exports = { AnalyticsDataProvider }
