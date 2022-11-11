const { prepareKeystoneExpressApp } = require('@open-condo/keystone/test.utils')

const index = require('@app/condo')
const { find } = require('@open-condo/keystone/schema')
const { Contact } = require('@condo/domains/contact/utils/serverSchema')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')

function exit (code, error) {
    console.error(error)
    process.exit(code)
}

async function init () {
    const { keystone } = await prepareKeystoneExpressApp(index, { excludeApps: ['NextApp'] })
    if (!keystone) exit(3, 'ERROR: Wrong prepare Keystone result')
    const adapter = keystone.adapter
    if (!adapter || !adapter._createTables || !adapter.knex) exit(4, 'ERROR: No KNEX adapter! Check the DATABASE_URL or The Keystone configuration')
    const knex = adapter.knex
    const context = await keystone.createContext({ skipAccessControl: true })
    return { context, knex }
}

async function softDeleteContacts (contactsToDelete, context) {
    const now = new Date().toISOString()

    for (const contact of contactsToDelete) {
        await Contact.update(context, contact.id, {
            deletedAt: now,
            sender: { dv: 1, fingerprint: 'delete-contact-duplicates' },
            dv: 1,
        })
    }
}

async function updateTicketsContact (ticketIds, contactId, context) {
    for (const ticketId of ticketIds) {
        await Ticket.update(context, ticketId, {
            contact: { connect: { id: contactId } },
            sender: { dv: 1, fingerprint: 'delete-contact-duplicates' },
            dv: 1,
        })
    }
}

function getLatestCreatedContact (contacts) {
    return contacts.sort((a, b) => {
        return (a.createdAt < b.createdAt) ? 1 : ((a.createdAt > b.createdAt) ? -1 : 0)
    })[0]
}

async function getContactTicketsPairs (contacts) {
    const contactTicketsPairs = []

    for (const contact of contacts) {
        const tickets = await find('Ticket', {
            contact: { id: contact.id },
            deletedAt: null,
        })

        if (tickets.length > 0) {
            contactTicketsPairs.push({ contact: contact, tickets: tickets.map(ticket => ticket.id) })
        }
    }

    return contactTicketsPairs
}

async function deleteContactDuplicates () {
    const { knex, context } = await init()

    const duplicateContactsData = await knex.raw(`
        select "phone", "property", "unitName", "unitType" from "Contact"
        where "deletedAt" is null
        group by "phone", "property", "unitName", "unitType"
        having count(*) > 1;
    `)

    for (const contactData of duplicateContactsData.rows) {
        const { phone, property, unitName, unitType } = contactData

        const contacts = await find('Contact', {
            phone,
            property: { id: property },
            unitName,
            unitType,
            deletedAt: null,
        })

        const contactTicketsPairs = await getContactTicketsPairs(contacts)
        let contactsToDelete = []

        if (contactTicketsPairs.length === 0) {
            const latestCreatedContact = getLatestCreatedContact(contacts)
            contactsToDelete = contacts.filter(contact => contact.id !== latestCreatedContact.id)
        } else {
            const contactsWithTickets = contactTicketsPairs.map(obj => obj.contact)
            const latestCreatedContact = getLatestCreatedContact(contactsWithTickets)

            const ticketsToUpdateContact = contactTicketsPairs
                .filter(obj => obj.contact.id !== latestCreatedContact.id)
                .flatMap(obj => obj.tickets)
            await updateTicketsContact(ticketsToUpdateContact, latestCreatedContact.id, context)

            contactsToDelete = contacts.filter(contact => contact.id !== latestCreatedContact.id)
        }

        await softDeleteContacts(contactsToDelete, context)
    }
}

module.exports = {
    deleteContactDuplicates,
}