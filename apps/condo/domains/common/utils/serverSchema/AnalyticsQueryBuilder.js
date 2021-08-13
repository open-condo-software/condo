const has = require('lodash/has')

class AnalyticsQueryBuilder {
    domainName = null
    where = []
    dayGroups = ['day', 'month', 'week', 'quarter', 'year']
    dayGroup = 'day'
    dateRange = { from: null, to: null }
    groups = []
    result = null

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

    getResult (mapLambda = null) {
        if (mapLambda !== null) {
            return this.result.map(mapLambda)
        }
        return this.result
    }

    isWhereInCondition (condition) {
        const [, query] = Object.entries(condition)[0]
        return has(query, 'id_in')
    }
}

module.exports = {
    AnalyticsQueryBuilder,
}
