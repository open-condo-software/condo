const { get } = require('lodash')

const { getById } = require('@open-condo/keystone/schema')

const { IncidentChange } = require('./index')


const createIncidentChange = async (fieldsChanges, { existingItem, updatedItem, context }) => {
    const payload = {
        dv: 1,
        sender: updatedItem.sender,
        incident: { connect: { id: existingItem.id } },
        ...fieldsChanges,
    }
    await IncidentChange.create(
        context.createContext({ skipAccessControl: true }),
        payload,
    )
}

const incidentChangeDisplayNameResolversForSingleRelations = {
    'organization': async (itemId) => {
        if (!itemId) return null
        const item = await getById('Organization', itemId)
        return get(item, 'name')
    },
}

const incidentRelatedManyToManyResolvers = {}

module.exports = {
    incidentChangeDisplayNameResolversForSingleRelations,
    incidentRelatedManyToManyResolvers,
    createIncidentChange,
}
