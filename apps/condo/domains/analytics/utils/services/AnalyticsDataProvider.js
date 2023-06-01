class AnalyticsDataProvider {
    constructor (props) {
        this.entities = props.entities
    }

    async loadAll () {
        const result = {}

        for (const [entityName, { provider, queryOptions }] of Object.entries(this.entities)) {
            result[entityName] = await provider.get(queryOptions)
        }

        return result
    }
}

module.exports = { AnalyticsDataProvider }
