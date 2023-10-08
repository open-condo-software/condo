const isNull = require('lodash/isNull')

class AnalyticsDataProvider {
    constructor (props) {
        this.entities = props.entities
    }

    async loadAll () {
        return await this.load(Object.entries(this.entities))
    }

    async loadSelected (selectedEntities) {
        const entitiesToLoad = Object.entries(this.entities).filter(([name]) => selectedEntities.includes(name))

        return await this.load(entitiesToLoad)
    }

    async load (entities) {
        const result = {}

        for (const [entityName, { provider, queryOptions, remappingOptions = null }] of entities) {
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
