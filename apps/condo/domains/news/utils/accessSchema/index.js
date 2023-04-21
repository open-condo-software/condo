const { flatten, get } = require('lodash')

/**
 * @param {Resident[]} residents
 * @returns {{deletedAt: null, OR: Object[]}}}
 */
function queryFindNewsItemsScopesByResidents (residents) {
    return {
        OR: flatten(residents.map((resident) => {
            const organizationId = get(resident, 'organization')
            const propertyId = get(resident, 'property')
            const unitType = get(resident, 'unitType')
            const unitName = get(resident, 'unitName')

            return [
                {
                    AND: [
                        {
                            newsItem: { organization: { id: organizationId } },
                        },
                        {
                            OR: [
                                {
                                    AND: [
                                        { property_is_null: true },
                                        { unitType: null },
                                        { unitName: null },
                                    ],
                                },
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
                    ],
                },
            ]
        })),
    }
}

/**
 * @param {NewsItem} newsItem
 * @param {NewsItemScope[]} newsItemScopes
 */
function queryFindResidentsByNewsItemAndScopes (newsItem, newsItemScopes) {
    return {
        AND: [
            { organization: { id: newsItem.organization } },
            {
                OR: newsItemScopes.map((scope) => {
                    const propertyId = get(scope, 'property')
                    const unitType = get(scope, 'unitType')
                    const unitName = get(scope, 'unitName')

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
            },
        ],
    }
}

module.exports = {
    queryFindNewsItemsScopesByResidents,
    queryFindResidentsByNewsItemAndScopes,
}
