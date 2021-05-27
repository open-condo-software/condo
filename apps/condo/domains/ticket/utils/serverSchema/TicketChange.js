const _ = require('lodash')
const { TicketChange } = require('./index')
const { getById } = require('@core/keystone/schema')

/*
    TODO(antonal): when this function will be used, strange errors occuring, like "Cannot query field "statusReopenedCounterFrom" on type "TicketChange".',"
 */
// const fieldsToTrackInTicketForChanges = () => (
//     trackableFieldsFrom(Ticket.schema, { except: OMIT_TICKET_CHANGE_TRACKABLE_FIELDS })
// )

const createTicketChange = async (fieldsChanges, { existingItem, updatedItem, context }) => {
    const payload = {
        dv: 1,
        sender: updatedItem.sender,
        ticket: { connect: { id: existingItem.id } },
        ...fieldsChanges,
    }
    await TicketChange.create(
        context.createContext({ skipAccessControl: true }),
        payload,
    )
}

/**
 * String representation of related item in a single relationship.
 * Will be displayed in UI in changes history block.
 * 👉 When a new single relation field will be added to Ticket, new resolver should be implemented here
 */
const ticketChangeDisplayNameResolversForSingleRelations = {
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

/**
 * String representation of related items in a `many: true` relationship.
 * Will be displayed in UI in changes history block.
 * 👉 When a new "many" relation field will be added to Ticket, new resolver should be implemented here
 */
const relatedManyToManyResolvers = {
    'watchers': async ({ context, existingItem, originalInput }) => {
        let updated
        const updatedResult = await context.executeGraphQL({
            context: context.createContext({ skipAccessControl: true }),
            query: `
                query changeTrackable_findTicketWatchersForTicketChange($id: ID!) {
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
        if (updatedResult.errors) {
            console.error('Error while fetching related items in relatedManyToManyResolvers of changeTrackable for a Ticket', updatedResult.errors)
            return {}
        }
        if (updatedResult.data.ticket) {
            updated = {
                ids: _.map(updatedResult.data.ticket.watchers, 'id'),
                displayNames: _.map(updatedResult.data.ticket.watchers, 'name'),
            }
        }

        /*
            Restore previous list of related items
            This is a tricky part, because we need to restore previous list of related items,
            that explicitly is not presented anywhere.
            Following solutions was considered:
            1. Get it from `beforeChange` hook of the Ticket, but where to store it?
            2. Get previous TicketChange and get it from `watchersIdsTo` field.
               This solution is not suitable for handling first change,
               because there will be no `TicketChange` item yet.
            3. Get current `watchers` list (after update) and make a replay,
               based on Keystone `originalInput`, which stores "Nested mutation" operations
               for this relationship. This variant is implemented.
        */
        let existing = _.cloneDeep(updated)
        if (originalInput && originalInput.watchers) {
            if (originalInput.watchers.disconnect) {
                // Perform opposite operation
                existing.ids = _.uniq([...existing.ids, ..._.map(originalInput.watchers.disconnect, 'id')])
            }
            if (originalInput.watchers.connect) {
                // Perform opposite operation
                existing.ids = _.difference(existing.ids, _.map(originalInput.watchers.connect, 'id'))
            }
        }
        const usersResult = await context.executeGraphQL({
            context: context.createContext({ skipAccessControl: true }),
            query: `
                query changeTrackable_findUsers($ids: [ID!]) {
                    users: allUsers(where: { id_in: $ids }) {
                        id
                        name
                    }
                }
            `,
            variables: { ids: existing.ids },
        })
        if (usersResult.error) {
            console.error('Error while fetching users in relatedManyToManyResolvers of changeTrackable for a Ticket', updatedResult.errors)
            return {}
        }
        if (usersResult.data.users) {
            existing.displayNames = _.map(usersResult.data.users, 'name')
        }

        return {
            existing,
            updated,
        }
    },
}

module.exports = {
    createTicketChange,
    ticketChangeDisplayNameResolversForSingleRelations,
    relatedManyToManyResolvers,
}