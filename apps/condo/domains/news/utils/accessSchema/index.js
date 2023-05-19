const { flatten, get } = require('lodash')

/**
 * @param {Resident[]} residents
 * @returns {{OR: Object[]}}}
 */
function queryFindNewsItemsScopesByResidents (residents) {
    return {
        OR: flatten(residents.map((resident) => {
            const propertyId = get(resident, 'property')
            const unitType = get(resident, 'unitType')
            const unitName = get(resident, 'unitName')

            return [
                {
                    OR: [
                        {
                            AND: [
                                { property: { id: propertyId } },
                                { unitType: null },
                                { unitName: null },
                            ],
                        },
                        {
                            AND: [
                                { property: { id: propertyId } },
                                { unitType },
                                { unitName: null },
                            ],
                        },
                        {
                            AND: [
                                { property: { id: propertyId } },
                                { unitType },
                                { unitName: unitName },
                            ],
                        },
                    ],
                },
            ]
        })),
    }
}

/**
 * @param {String} organizationId
 * @param {NewsItemScope[]} newsItemScopes
 */
function queryFindResidentsByNewsItemAndScopes (organizationId, newsItemScopes) {
    const whereConditions = {
        AND: [],
    }
    if (organizationId) {
        whereConditions.AND.push({
            organization: { id: organizationId },
            deletedAt: null,
        })
    }
    if (newsItemScopes.length > 0) {
        whereConditions.AND.push({
            OR: newsItemScopes.map((scope) => {
                const unitType = get(scope, 'unitType')
                const unitName = get(scope, 'unitName')
                const propertyId = get(scope, ['property', 'id'])

                const AND = []

                if (propertyId) {
                    AND.push({ property: { id: propertyId } })
                }

                if (unitType) {
                    AND.push({ unitType })
                }

                if (unitName) {
                    AND.push({ unitName })
                }

                return { AND }
            }),
        })
    }
    return whereConditions
}

module.exports = {
    queryFindNewsItemsScopesByResidents,
    queryFindResidentsByNewsItemAndScopes,
}
