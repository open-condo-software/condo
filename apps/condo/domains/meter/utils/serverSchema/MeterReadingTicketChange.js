const { MeterReadingChange: MeterReadingTicketChange } = '@condo/domains/meter/utils/serverSchema'
const { get } = require('lodash')
const { getById } = require('@core/keystone/schema')


const OMIT_METER_READING_TICKET_CHANGE_TRACKABLE_FIELDS = ['v', 'dv', 'sender', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy']

const createMeterReadingTicketChange = async (fieldsChanges, { existingItem, updatedItem, context }) => {
    const payload = {
        dv: 1,
        sender: updatedItem.sender,
        meterReading: { connect: { id: existingItem.id } },
        ...fieldsChanges,
    }
    await MeterReadingTicketChange.create(
        context.createContext({ skipAccessControl: true }),
        payload,
    )
}

/**
 * String representation of related item in a single relationship.
 * Will be displayed in UI in changes history block.
 * 👉 When a new single relation field will be added to Ticket, new resolver should be implemented here
 */
const meterReadingTicketChangeDisplayNameResolversForSingleRelations = {
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

// TODO(nomerdvadcatpyat): write relatedManyToManyResolvers for meterReadings field


module.exports = {
    createMeterReadingTicketChange,
    meterReadingTicketChangeDisplayNameResolversForSingleRelations,
    OMIT_METER_READING_TICKET_CHANGE_TRACKABLE_FIELDS,
}
