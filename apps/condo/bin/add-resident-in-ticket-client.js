const path = require('path')
const { find, getByCondition, getById } = require('@core/keystone/schema')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const get = require('lodash/get')
const { RESIDENT } = require('@condo/domains/user/constants/common')

class FixTicketClients {
    context = null
    brokenTickets = []

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
        this.brokenTickets = await find('Ticket', {
            client_is_null: true,
        })
    }

    async fixBrokenTickets () {
        if (!get(this.brokenTickets, 'length')) return

        for (const ticket of this.brokenTickets) {
            const ticketContactId = get(ticket, 'contact')

            // if ticket have a contact -> find resident matches contact.phone, ticket.property, ticket.unitName and ticket.unitType fields
            if (ticketContactId) {
                const ticketContact = await getById('Contact', ticketContactId, null)
                const ticketContactPhone = get(ticketContact, 'phone', null)
                const ticketPropertyId = get(ticket, 'property', null)
                const ticketUnitName = get(ticket, 'unitName', null)
                const ticketUnitType = get(ticket, 'unitType', null)

                const resident = await getByCondition('Resident', {
                    user: { phone: ticketContactPhone },
                    property: { id: ticketPropertyId },
                    unitName: ticketUnitName,
                    unitType: ticketUnitType,
                })

                if (resident) {
                    const residentUserId = get(resident, 'user', null)
                    const user = await getById('User', residentUserId)
                    const userPhone = get(user, 'phone', null)
                    const userName = get(user, 'name', null)
                    const userEmail = get(user, 'email', null)

                    await Ticket.update(this.context, ticket.id, {
                        clientName: userName,
                        clientPhone: userPhone,
                        clientEmail: userEmail,
                        client: { connect: { id: residentUserId } },
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'fixTicketScript' },
                    })
                }
            }
        }
    }
}

const fixTickets = async () => {
    const fixer = new FixTicketClients()
    console.info('[INFO] Connecting to database...')
    await fixer.connect()
    console.info('[INFO] Finding broken tickets...')
    await fixer.findBrokenTickets()
    console.info(`[INFO] Following tickets will be fixed: [${fixer.brokenTickets.map(ticket => `"${ticket.id}"`).join(', ')}]`)
    await fixer.fixBrokenTickets()
    console.info('[INFO] Broken tickets are fixed...')
}

fixTickets().then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
})