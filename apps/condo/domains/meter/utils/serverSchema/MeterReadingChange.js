import { MeterReadingChange } from '@condo/domains/meter/utils/serverSchema'

const { get } = require('lodash')
const { getById } = require('@core/keystone/schema')


const OMIT_METER_READING_CHANGE_TRACKABLE_FIELDS = ['v', 'dv', 'sender', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy']

const createMeterReadingChange = async (fieldsChanges, { existingItem, updatedItem, context }) => {
    const payload = {
        dv: 1,
        sender: updatedItem.sender,
        meterReading: { connect: { id: existingItem.id } },
        ...fieldsChanges,
    }
    await MeterReadingChange.create(
        context.createContext({ skipAccessControl: true }),
        payload,
    )
}

/**
 * String representation of related item in a single relationship.
 * Will be displayed in UI in changes history block.
 * 👉 When a new single relation field will be added to Ticket, new resolver should be implemented here
 */
const meterReadingChangeDisplayNameResolversForSingleRelations = {
    'account': async (itemId) => {
        const item = await getById('BillingAccount', itemId)
        return get(item, 'number')
    },
    'meter': async (itemId) => {
        const item = await getById('Meter', itemId)
        return get(item, 'number')
    },
    'organization': async (itemId) => {
        const item = await getById('Organization', itemId)
        return get(item, 'name')
    },
    'property': async (itemId) => {
        const item = await getById('Property', itemId)
        return get(item, 'address')
    },
    'client': async (itemId) => {
        const item = await getById('User', itemId)
        return get(item, 'name')
    },
    'contact': async (itemId) => {
        const item = await getById('Contact', itemId)
        return get(item, 'name')
    },
    'source': async (itemId) => {
        const item = await getById('TicketSource', itemId)
        return get(item, 'name')
    },
}


module.exports = {
    createMeterReadingChange,
    meterReadingChangeDisplayNameResolversForSingleRelations,
    OMIT_METER_READING_CHANGE_TRACKABLE_FIELDS,
}
