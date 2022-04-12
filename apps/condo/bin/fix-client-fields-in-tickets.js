const path = require('path')
const { find } = require('@core/keystone/schema')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const get = require('lodash/get')

class FixTicketClients {
    context = null
    clientIsNullTickets = []

    async connect () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async findBrokenTickets () {
        // Tickets where client is null
        this.clientIsNullTickets = await find('Ticket', {
            client_is_null: true,
        })

        // Tickets where client is not null, but client fields are null
        this.clientIsNotNullTickets = await find('Ticket', {
            client_is_null: false,
            clientName: null,
            clientPhone: null,
            clientEmail: null,
        })
    }

    async fixClientIsNullTickets () {
        if (!get(this.clientIsNullTickets, 'length')) return

        const ticketsProperties = this.clientIsNullTickets.map(ticket => ticket.property)

        const contactsInTicketsProperty = await find('Contact', {
            property: { id_in: ticketsProperties },
        })
        const residentsInTicketsProperty = await find('Resident', {
            property: { id_in: ticketsProperties },
        })
        const residentsUsers = await find('User', {
            id_in: residentsInTicketsProperty.map(resident => resident.user),
        })

        for (const ticket of this.clientIsNullTickets) {
            const ticketContactId = get(ticket, 'contact')

            // if ticket has a contact
            if (ticketContactId) {
                const ticketContact = contactsInTicketsProperty.find(contact => contact.id === ticketContactId)
                const ticketContactPhone = get(ticketContact, 'phone', null)
                const ticketContactEmail = get(ticketContact, 'email', null)
                const ticketContactName = get(ticketContact, 'name', null)
                const ticketPropertyId = get(ticket, 'property', null)
                const ticketUnitName = get(ticket, 'unitName', null)
                const ticketUnitType = get(ticket, 'unitType', null)

                // find resident matches contact.phone, ticket.property, ticket.unitName and ticket.unitType fields
                const resident = residentsInTicketsProperty.find(resident => {
                    const residentUser = residentsUsers.find(user => user.id === resident.user)
                    const residentUserPhone = get(residentUser, 'phone')
                    const residentPropertyId = get(resident, 'property')
                    const residentUnitName = get(resident, 'unitName')
                    const residentUnitType = get(resident, 'unitType')

                    return  residentUserPhone === ticketContactPhone &&
                            residentPropertyId === ticketPropertyId &&
                            residentUnitName === ticketUnitName &&
                            residentUnitType === ticketUnitType
                })

                if (resident) {
                    // if resident founded fill ticket client fields by resident fields
                    const residentUser = residentsUsers.find(user => user.id === resident.user)
                    const userPhone = get(residentUser, 'phone', null)
                    const userName = get(residentUser, 'name', null)
                    const userEmail = get(residentUser, 'email', null)

                    await Ticket.update(this.context, ticket.id, {
                        clientName: userName,
                        clientPhone: userPhone,
                        clientEmail: userEmail,
                        client: { connect: { id: residentUser.id } },
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'fixTicketScript' },
                    })
                } else {
                    // if resident not founded fill ticket client fields by contact fields
                    await Ticket.update(this.context, ticket.id, {
                        clientName: ticketContactName,
                        clientPhone: ticketContactPhone,
                        clientEmail: ticketContactEmail,
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'fixTicketScript' },
                    })
                }
            }
        }
    }

    async fixClientIsNotNullTickets () {
        if (!get(this.clientIsNotNullTickets, 'length')) return

        const clientUsers = await find('User', {
            id_in: this.clientIsNotNullTickets.map(ticket => ticket.client),
        })

        for (const ticket of this.clientIsNotNullTickets) {
            const ticketClientUser = clientUsers.find(user => user.id === ticket.client)
            const userName = get(ticketClientUser, 'name', null)
            const userPhone = get(ticketClientUser, 'phone', null)
            const userEmail = get(ticketClientUser, 'email', null)

            await Ticket.update(this.context, ticket.id, {
                clientName: userName,
                clientPhone: userPhone,
                clientEmail: userEmail,
                dv: 1,
                sender: { dv: 1, fingerprint: 'fixTicketScript' },
            })
        }
    }
}

const fixTickets = async () => {
    const fixer = new FixTicketClients()
    console.info('[INFO] Connecting to database...')
    await fixer.connect()
    console.info('[INFO] Finding broken tickets...')
    await fixer.findBrokenTickets()
    console.info(`[INFO] Following tickets with client is null will be fixed: [${fixer.clientIsNullTickets.map(ticket => `"${ticket.id}"`).join(', ')}]`)
    await fixer.fixClientIsNullTickets()
    console.info(`[INFO] Following tickets with client fields is null will be fixed: [${fixer.clientIsNotNullTickets.map(ticket => `"${ticket.id}"`).join(', ')}]`)
    await fixer.fixClientIsNotNullTickets()
    console.info('[INFO] Tickets are fixed...')
}

fixTickets().then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
})