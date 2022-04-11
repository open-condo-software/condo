const path = require('path')
const { find } = require('@core/keystone/schema')
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
        // Ticket created from resident, but canReadByResident is false
        this.brokenTickets = await find('Ticket', {
            AND: [
                { createdBy: { type: RESIDENT } },
                { canReadByResident: false },
            ],
        })
    }

    async fixBrokenTickets () {
        if (!get(this.brokenTickets, 'length')) return

        for (const ticket of this.brokenTickets) {
            await Ticket.update(this.context, ticket.id, {
                canReadByResident: true,
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