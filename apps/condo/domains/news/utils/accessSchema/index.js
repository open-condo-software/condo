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

module.exports = {
    queryFindNewsItemsScopesByResidents,
}
