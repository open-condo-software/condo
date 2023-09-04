const dayjs = require('dayjs')
const { get, map, cloneDeep, uniq, difference } = require('lodash')

const { getById } = require('@open-condo/keystone/schema')

const { TicketChange } = require('./index')

/*
    TODO(antonal): when this function will be used, strange errors occuring, like "Cannot query field "statusReopenedCounterFrom" on type "TicketChange".',"
 */
// const fieldsToTrackInTicketForChanges = () => (
//     buildSetOfFieldsToTrackFrom(Ticket.schema, { except: OMIT_TICKET_CHANGE_TRACKABLE_FIELDS })
// )

const createTicketChange = async (fieldsChanges, { existingItem, updatedItem, context }) => {
    const newItem = { ...existingItem, ...updatedItem }
    const payload = {
        dv: 1,
        sender: updatedItem.sender,
        ticket: { connect: { id: existingItem.id } },
        ...fieldsChanges,
    }

    // If status was changed
    if (newItem.statusUpdatedAt && (fieldsChanges.statusIdFrom && fieldsChanges.statusIdTo)) {
        payload.actualCreationDate = dayjs(newItem.statusUpdatedAt).toISOString()
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
        if (!itemId) return null
        const item = await getById('Organization', itemId)
        return get(item, 'name')
    },
    'property': async (itemId) => {
        if (!itemId) return null
        const item = await getById('Property', itemId)
        return get(item, 'address')
    },
    'status': async (itemId) => {
        if (!itemId) return null
        const item = await getById('TicketStatus', itemId)
        return get(item, 'name')
    },
    'client': async (itemId) => {
        if (!itemId) return null
        const item = await getById('User', itemId)
        return get(item, 'name')
    },
    'contact': async (itemId) => {
        if (!itemId) return null
        const item = await getById('Contact', itemId)
        return get(item, 'name')
    },
    'operator': async (itemId) => {
        if (!itemId) return null
        const item = await getById('User', itemId)
        return get(item, 'name')
    },
    'assignee': async (itemId) => {
        if (!itemId) return null
        const item = await getById('User', itemId)
        return get(item, 'name')
    },
    'executor': async (itemId) => {
        if (!itemId) return null
        const item = await getById('User', itemId)
        return get(item, 'name')
    },
    'classifier': async (itemId) => {
        if (!itemId) return null
        const classifierGetById = await getById('TicketClassifier', itemId)
        const placeClassifier = await getById('TicketPlaceClassifier', classifierGetById.place)
        const categoryClassifier = await getById('TicketCategoryClassifier', classifierGetById.category)
        let problemClassifier = null
        if (get(classifierGetById, 'problem')) {
            problemClassifier = await getById('TicketProblemClassifier', classifierGetById.problem)
        }
        const classifiersMergedString = 
        `${placeClassifier.name} → ${categoryClassifier.name}${problemClassifier ? ` → ${problemClassifier.name}` : ''}`
        return classifiersMergedString
    },
    'source': async (itemId) => {
        if (!itemId) return null
        const item = await getById('TicketSource', itemId)
        return get(item, 'name')
    },
    'related': async (itemId) => {
        if (!itemId) return null
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
 * Variables, passed to Keystone "afterChange" hook
 *
 * @typedef KeystoneOperationArgsForTicketChange
 * @param context
 * @param existingItem
 * @param originalInput
 */

/**
 *
 * @param fieldName - name of Ticket field
 * @param ref - name of Ticket field entity type
 * @param displayNameAttr - attribute of related entity, that will act as display name
 * @param {KeystoneOperationArgsForTicketChange} args - variables, passed to Keystone afterChange hook
 * @return {Promise<{existing: {displayNames: *, ids: *}, updated: {displayNames: *, ids: *}}}|{}>}
 */
const resolveManyToManyField = async (fieldName, ref, displayNameAttr = 'name', args) => {
    const { context, existingItem, originalInput } = args
    let updated
    const updatedResult = await context.executeGraphQL({
        context: context.createContext({ skipAccessControl: true }),
        query: `
                query changeTrackable_findTicket_${fieldName}_ForTicketChange($id: ID!) {
                    ticket: Ticket(where: { id: $id }) {
                        id
                        ${fieldName} {
                            id
                            name
                        }
                    }
                }
            `,
        variables: { id: existingItem.id },
    })
    if (updatedResult.errors) {
        // this log entry for development & support purposes only
        // no important logs can be hided by injected external console.log formatters
        // no logs formatters can be injected
        // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
        console.error(`Error while fetching related ${fieldName} in manyToManyResolver of changeTrackable for a Ticket`, updatedResult.errors)
        return {}
    }
    if (updatedResult.data.ticket) {
        updated = {
            ids: map(updatedResult.data.ticket[fieldName], 'id'),
            displayNames: map(updatedResult.data.ticket[fieldName], displayNameAttr),
        }
    }

    /*
        Restore previous list of related items
        This is a tricky part, because we need to restore previous list of related items,
        that explicitly is not presented anywhere.
        Following solutions was considered:
        1. Get it from `beforeChange` hook of the Ticket, but where to store it?
        2. Get previous TicketChange and get it from `…IdsTo` field.
           This solution is not suitable for handling first change,
           because there will be no `TicketChange` item yet.
        3. Get current items list (after update) and make a replay,
           based on Keystone `originalInput`, which stores "Nested mutation" operations
           for this relationship. This variant is implemented.
    */
    let existing = cloneDeep(updated)
    if (originalInput && originalInput[fieldName]) {
        if (originalInput[fieldName].disconnect) {
            // Perform opposite operation
            existing.ids = uniq([...existing.ids, ...map(originalInput[fieldName].disconnect, 'id')])
        }
        if (originalInput[fieldName].connect) {
            // Perform opposite operation
            existing.ids = difference(existing.ids, map(originalInput[fieldName].connect, 'id'))
        }
    }
    const existingResult = await context.executeGraphQL({
        context: context.createContext({ skipAccessControl: true }),
        query: `
                query changeTrackable_find${ref}s($ids: [ID!]) {
                    items: all${ref}s(where: { id_in: $ids }) {
                        id
                        ${displayNameAttr}
                    }
                }
            `,
        variables: { ids: existing.ids },
    })
    if (existingResult.error) {
        console.error('Error while fetching users in relatedManyToManyResolvers of changeTrackable for a Ticket', updatedResult.errors)
        return {}
    }
    if (existingResult.data.items) {
        existing.displayNames = map(existingResult.data.items, 'name')
    }

    return {
        existing,
        updated,
    }
}

/**
 * String representation of related items in a `many: true` relationship.
 * Will be displayed in UI in changes history block.
 * 👉 When a new "many" relation field will be added to Ticket, new resolver should be implemented here
 * In the example below, we are adding resolver for field `files`, that should exist in `Ticket`
 * and for display text in change history we are using field `name` of `TicketFile` schema.
 * NOTE: This is how it was implemented before deprecation of all many-to-many relationships in `Ticket` schema
 * for performance reasons. Implementation of resolvers will also be changed after it.
 * @example
 * const relatedManyToManyResolvers = {
 *     'files': async (args) => {
 *           return resolveManyToManyField('files', 'TicketFile', 'name', args)
 *     }
 * }
 */
const relatedManyToManyResolvers = {}

module.exports = {
    createTicketChange,
    ticketChangeDisplayNameResolversForSingleRelations,
    relatedManyToManyResolvers,
}
