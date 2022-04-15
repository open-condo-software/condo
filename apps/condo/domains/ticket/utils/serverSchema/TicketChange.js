const { get, map, cloneDeep, uniq, difference } = require('lodash')
const { TicketChange } = require('./index')
const { getById } = require('@core/keystone/schema')

/*
    TODO(antonal): when this function will be used, strange errors occuring, like "Cannot query field "statusReopenedCounterFrom" on type "TicketChange".',"
 */
// const fieldsToTrackInTicketForChanges = () => (
//     buildSetOfFieldsToTrackFrom(Ticket.schema, { except: OMIT_TICKET_CHANGE_TRACKABLE_FIELDS })
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
    'organization': async (itemId) => {
        const item = await getById('Organization', itemId)
        return get(item, 'name')
    },
    'property': async (itemId) => {
        const item = await getById('Property', itemId)
        return get(item, 'address')
    },
    'status': async (itemId) => {
        const item = await getById('TicketStatus', itemId)
        return get(item, 'name')
    },
    'client': async (itemId) => {
        const item = await getById('User', itemId)
        return get(item, 'name')
    },
    'contact': async (itemId) => {
        const item = await getById('Contact', itemId)
        return get(item, 'name')
    },
    'operator': async (itemId) => {
        const item = await getById('User', itemId)
        return get(item, 'name')
    },
    'assignee': async (itemId) => {
        const item = await getById('User', itemId)
        return get(item, 'name')
    },
    'executor': async (itemId) => {
        const item = await getById('User', itemId)
        return get(item, 'name')
    },
    'placeClassifier': async (itemId) => {
        const item = await getById('TicketPlaceClassifier', itemId)
        return get(item, 'name')
    },
    'categoryClassifier': async (itemId) => {
        const item = await getById('TicketCategoryClassifier', itemId)
        return get(item, 'name')
    },
    'problemClassifier': async (itemId) => {
        const item = await getById('TicketProblemClassifier', itemId)
        return get(item, 'name')
    },
    'source': async (itemId) => {
        const item = await getById('TicketSource', itemId)
        return get(item, 'name')
    },
    'related': async (itemId) => {
        const item = await getById('Ticket', itemId)
        if (!item) {
            return null
        } else {
            const number = get(item, 'number')
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
                ids: map(updatedResult.data.ticket.watchers, 'id'),
                displayNames: map(updatedResult.data.ticket.watchers, 'name'),
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
        let existing = cloneDeep(updated)
        if (originalInput && originalInput.watchers) {
            if (originalInput.watchers.disconnect) {
                // Perform opposite operation
                existing.ids = uniq([...existing.ids, ...map(originalInput.watchers.disconnect, 'id')])
            }
            if (originalInput.watchers.connect) {
                // Perform opposite operation
                existing.ids = difference(existing.ids, map(originalInput.watchers.connect, 'id'))
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
            existing.displayNames = map(usersResult.data.users, 'name')
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
