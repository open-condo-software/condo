const _ = require('lodash')
const { TicketChange } = require('./index')
const { getById } = require('@core/keystone/schema')

const createTicketChange = async (fieldsChanges, existingItem, context) => {
    const payload = {
        dv: 1,
        ticket: { connect: { id: existingItem.id } },
        ...fieldsChanges,
    }
    await TicketChange.create(
        context.createContext({ skipAccessControl: true }),
        payload,
    )
}

const displayNameResolvers = {
    'property': async (itemId) => {
        const item = await getById('Property', itemId)
        return _.get(item, 'name')
    },
    'status': async (itemId) => {
        const item = await getById('TicketStatus', itemId)
        return _.get(item, 'name')
    },
    'client': async (itemId) => {
        const item = await getById('User', itemId)
        return _.get(item, 'name')
    },
    'operator': async (itemId) => {
        const item = await getById('User', itemId)
        return _.get(item, 'name')
    },
    'assignee': async (itemId) => {
        const item = await getById('User', itemId)
        return _.get(item, 'name')
    },
    'executor': async (itemId) => {
        const item = await getById('User', itemId)
        return _.get(item, 'name')
    },
    'classifier': async (itemId) => {
        const item = await getById('TicketClassifier', itemId)
        return _.get(item, 'name')
    },
    'source': async (itemId) => {
        const item = await getById('TicketSource', itemId)
        return _.get(item, 'name')
    },
    'related': async (itemId) => {
        const item = await getById('Ticket', itemId)
        if (!item) {
            return null
        } else {
            const number = _.get(item, 'number')
            return number ? number.toString() : null
        }
    },
}

const relatedManyToManyResolvers = {
    'watchers': async ({ context, existingItem, originalInput }) => {
        /*
            TODO(antonal): figure out how to get old list of related items in many-to-many relationship.
            First variant is to get it from `beforeChange` hook of the Ticket,
            but where to store it?
            Second variant is to get previous TicketChange and get it
            from `watchersIdsTo` field. I think, second variant is much easier to implement
        */
        // let oldIds = []
        // if (originalInput && originalInput.watchers) {
        // }

        const { errors, data } = await context.executeGraphQL({
            context: context.createContext({ skipAccessControl: true }),
            query: `
                query findRelatedItems($id: ID!, $oldIds: [ID!]) {
                    ticket: Ticket(where: { id: $id }) {
                        id
                        watchers {
                          id
                          name
                        }
                      }
                    }
                `,
            variables: { id: existingItem.id },
        })
        if (errors) {
            console.error('Error while fetching related items in relatedManyToManyResolvers of Ticket', errors)
            return []
        }
        if (data.ticket) {
            return {
                existing: {
                    ids: [], // TODO(antonal): figure out how to get old list of related items in many-to-many relationship.
                    displayNames: [], // TODO(antonal): figure out how to get old list of related items in many-to-many relationship.
                },
                updated: {
                    ids: _.map(data.ticket.watchers, 'id'),
                    displayNames: _.map(data.ticket.watchers, 'name'),
                },
            }
        }
    },
}

module.exports = {
    createTicketChange,
    displayNameResolvers,
    relatedManyToManyResolvers,
}