const Big = require('big.js')

const { AbstractDataLoader } = require('@condo/domains/analytics/utils/services/dataLoaders/AbstractDataLoader')
const { GqlWithKnexLoadList } = require('@condo/domains/common/utils/serverSchema')

class PropertyDataLoader extends AbstractDataLoader {
    async get ({ where }) {
        const propertyUnitDataLoader = new GqlWithKnexLoadList({
            listKey: 'Property',
            fields: 'id',
            where: {
                ...where,
                deletedAt: null,
            },
        })

        const propertyIds = await propertyUnitDataLoader.load()
        const result = await propertyUnitDataLoader.loadAggregate('SUM("unitsCount")', propertyIds.map(({ id }) => id))

        return { sum: new Big(result.sum || 0).toFixed(0) }
    }
}

module.exports = { PropertyDataLoader }
