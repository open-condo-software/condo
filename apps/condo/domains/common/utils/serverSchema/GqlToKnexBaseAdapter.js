const has = require('lodash/has')

class GqlToKnexBaseAdapter {
    domainName = null
    where = []
    dayGroups = ['day', 'month', 'week', 'quarter', 'year']
    dayGroup = 'day'
    dateRange = { from: null, to: null }
    groups = []
    result = null

    /**
     * Formatting GQL expressions to Knex data structure
     * Converts Keystone GraphQL `…WhereInput` conditions to shape.
     * That will be used by working with Knex methods, described at https://knexjs.org/#Builder-where
     * @param domainName {string} the table for which the query will be executed
     * @param where {Object} GQL where condition
     * @param groupBy {Array} fields in domainName table that should be applied to result
     */
    constructor (domainName, where = {}, groupBy) {
        this.domainName = domainName
        let whereConditions = []
        for (const field in where) {
            if (field === 'AND') {
                whereConditions = [...whereConditions, ...where[field]]
            } else {
                whereConditions.push({ [field]: where[field] })
            }
        }
        whereConditions.forEach(condition => {
            Object.entries(condition).forEach(([field, query]) => {
                if (field === 'createdAt_gte') {
                    this.dateRange.from = query
                } else if (field === 'createdAt_lte') {
                    this.dateRange.to = query
                } else {
                    this.where.push({ [field]: query })
                }
            })
        })
        this.dayGroup = 'day'
        this.dayGroups.forEach(possibleDateGroup => {
            if (groupBy.includes(possibleDateGroup)) {
                this.dayGroup = possibleDateGroup
            }
        })
        this.groups = groupBy.filter(type => !this.dayGroups.includes(type))
    }

    /**
     * Returns knex query execution result
     * If mapLambda prop was provided, result will be modified
     * Example - gqlToKnex.getResult(({someField, itemProps}) => ({someField: parseInt(someField), ...itemProps}))
     * @param mapLambda {Function | null}
     * @returns {null|Array}
     */
    getResult (mapLambda = null) {
        if (mapLambda !== null) {
            return this.result.map(mapLambda)
        }
        return this.result
    }

    /**
     * Service method for split up where & where_in conditions
     * For more details check https://knexjs.org/#Builder-whereIn
     * @param condition {Array}
     * @returns {Boolean}
     */
    isWhereInCondition (condition) {
        const [, query] = Object.entries(condition)[0]
        return has(query, 'id_in')
    }
}

module.exports = {
    GqlToKnexBaseAdapter,
}
