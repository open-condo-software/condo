const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')
const isEmpty = require('lodash/isEmpty')

const { getByCondition } = require('@open-condo/keystone/schema')

const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')

class FixTicketsClientNameClientPhone {
    context = null
    brokenTickets = []
    successTicketChanged = 0
    errorTicketChanged = 0
    passedTicketChanged = 0

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
            chunkSize: 20,
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
            try {
                const contact = await getByCondition('Contact', {
                    id: ticket.contact.id,
                })

                if (contact) {
                    await Ticket.update(this.context, ticket.id, {
                        contact: { connect: { id: contact.id } },
                        clientName: contact.name,
                        clientPhone: contact.phone,
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'fixTicketsClientNameClientPhone' },
                    })
                    this.successTicketChanged++
                    console.info(`[INFO] Updated ticket with id ${ticket.id}`)
                } else {
                    this.passedTicketChanged++
                    console.info(`[INFO] Not updated ticket: (${ticket.id}). Not have contact`)
                }
            } catch (e) {
                this.errorTicketChanged++
                console.info(`[INFO] Failed to update Ticket with id: (${ticket.id})`)
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
    console.info(`[INFO] SUCCESS: ${fixer.successTicketChanged}`)
    console.info(`[INFO] PASSED: ${fixer.passedTicketChanged}`)
    console.info(`[INFO] ERROR: ${fixer.errorTicketChanged}`)
    console.info(`[INFO] ALL: ${fixer.brokenTickets.length}`)
}

fixTickets().then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
    process.exit(1)
})
