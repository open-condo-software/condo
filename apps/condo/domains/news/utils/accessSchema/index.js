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
            ]
        })),
    }
}

/**
 * @param {String} organizationId
 * @param {NewsItemScope[]} newsItemScopes
 */
function queryFindResidentsByOrganizationAndScopes (organizationId, newsItemScopes) {
    return {
        AND: [
            { organization: { id: organizationId } },
            {
                OR: newsItemScopes.map((scope) => {
                    const propertyId = get(scope, ['property', 'id'])
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
    queryFindResidentsByOrganizationAndScopes,
}
