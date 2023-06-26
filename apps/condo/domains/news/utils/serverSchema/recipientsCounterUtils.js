const compact = require('lodash/compact')
const filter = require('lodash/filter')
const find = require('lodash/find')
const get = require('lodash/get')
const identity = require('lodash/identity')
const pick = require('lodash/pick')
const pickBy = require('lodash/pickBy')

const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { queryFindResidentsByOrganizationAndScopes } = require('@condo/domains/news/utils/accessSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')

const getUnitsFromProperty = (property) => (
    property?.map?.sections?.reduce((acc, section) => ([
        ...acc,
        ...getUnitsFromSection(section),
    ]), []) || []
)

const getUnitsFromSection = (section) => section.floors.flatMap(floor => floor.units.map(unit => ({
    unitName: unit.label,
    unitType: unit.unitType,
})))

async function getUnitsData (context, organizationId, newsItemScopes) {
    const residents = await loadListByChunks({
        context,
        list: Resident,
        chunkSize: 50,
        where: {
            ...queryFindResidentsByOrganizationAndScopes(organizationId, newsItemScopes),
            deletedAt: null,
        },
    })

    const recipientsByNewsItemsScope = []
    const recipientsByOrganization = []
    let propertiesCount = 0
    const isAllOrganization = filter(newsItemScopes, { property: null, unitType: null, unitName: null }).length > 0

    if (isAllOrganization) {
        const propertiesByOrganization = await loadListByChunks({
            context,
            list: Property,
            chunkSize: 50,
            where: {
                organization: {
                    id: organizationId,
                },
                deletedAt: null,
            },
        })

        propertiesCount += propertiesByOrganization.length
        for (let property of propertiesByOrganization) {
            const units = getUnitsFromProperty(property)

            const recipientsData = units.map(({ unitName, unitType }) => ({
                address: property.address,
                unitName,
                hasResident: !!find(residents, { unitName, unitType, property: { id: property.id } }),
            }))
            recipientsByOrganization.push(...recipientsData)
        }
    } else {
        const compactedNewsItemScopes = compact(newsItemScopes)
        const propertiesIds = new Set()
        for (let newsItemScope of compactedNewsItemScopes) {
            if (get(newsItemScope, 'property.id')) {
                const property = await Property.getOne(context, {
                    id: newsItemScope.property.id,
                    deletedAt: null,
                })

                propertiesIds.add(property.id)

                const units = getUnitsFromProperty(property)

                const unitsFilter = pickBy(pick(newsItemScope, ['unitName', 'unitType']), identity)

                const filteredUnits = filter(units, unitsFilter)
                const filteredResidents = filter(residents, unitsFilter)
                const recipientsData = filteredUnits.map(({ unitName, unitType }) => ({
                    address: property.address,
                    unitName,
                    hasResident: !!find(filteredResidents, { unitName, unitType, property: { id: property.id } }),
                }))
                recipientsByNewsItemsScope.push(...recipientsData)
            }
        }

        propertiesCount = propertiesIds.size
    }

    return { propertiesCount, unitsData: [...recipientsByNewsItemsScope, ...recipientsByOrganization] }
}

module.exports = { getUnitsData }
