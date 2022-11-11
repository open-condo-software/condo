const path = require('path')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { getByCondition } = require('@open-condo/keystone/schema')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const isEmpty = require('lodash/isEmpty')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')

class FixTicketsClientNameClientPhone {
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
        // Tickets from resident with contact, but without clientName and clientPhone
        this.brokenTickets = await loadListByChunks({
            context: this.context,
            list: Ticket,
            where: {
                isResidentTicket: true,
                clientName_in: [null, ''],
                clientPhone_in: [null, ''],
                contact_is_null: false,
            },
        })
    }

    async fixBrokenTickets () {
        if (isEmpty(this.brokenTickets)) return

        for (const ticket of this.brokenTickets) {
            const contact = await getByCondition('Contact', {
                id: ticket.contact.id,
            })

            if (contact) {
                await Ticket.update(this.context, ticket.id, {
                    contact: { connect: { id: contact.id } },
                    clientName: contact.name,
                    clientPhone: contact.phone,
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'fixTicketScript' },
                })
            }
        }
    }
}

const fixTickets = async () => {
    const fixer = new FixTicketsClientNameClientPhone()
    console.info('[INFO] Connecting to database...')
    await fixer.connect()
    console.info('[INFO] Finding broken tickets...')
    await fixer.findBrokenTickets()
    console.info(`[INFO] Following tickets will be fixed (${fixer.brokenTickets.length}): [${fixer.brokenTickets.map(ticket => `"${ticket.id}"`).join(', ')}]`)
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
