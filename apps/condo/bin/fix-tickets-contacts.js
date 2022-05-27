const path = require('path')
const { find, getByCondition } = require('@core/keystone/schema')
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
        // Ticket created from resident, but has missing fields
        this.brokenTickets = await find('Ticket', {
            createdBy: { type: RESIDENT },
            contact_is_null: true,
        })
    }

    async fixBrokenTickets () {
        if (!get(this.brokenTickets, 'length')) return

        for (const ticket of this.brokenTickets) {
            const contact = await getByCondition('Contact', {
                organization: { id: ticket.organization },
                property: { id: ticket.property },
                unitName: ticket.unitName,
                unitType: ticket.unitType,
                phone: ticket.clientPhone,
                name: ticket.clientName,
            })

            if (contact) {
                await Ticket.update(this.context, ticket.id, {
                    contact: { connect: { id: contact.id } },
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'fixTicketScript' },
                })
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