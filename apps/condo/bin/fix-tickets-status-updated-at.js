const path = require('path')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const isEmpty = require('lodash/isEmpty')
const { Ticket, TicketChange } = require('@condo/domains/ticket/utils/serverSchema')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')

class FixTicketsClientNameClientPhone {
    context = null
    countTicketToChange = 0
    successTicketChanged = 0
    errorTicketChanged = 0
    passedTicketChanged = 0
    chunkSize = 50
    // Tickets with statusUpdatedAt is null, but with updated status (~ 12.000 tickets)
    where = {
        OR: [
            {
                AND: [{
                    statusUpdatedAt: null,
                    statusReopenedCounter: 0,
                    status: { id_not: STATUS_IDS.OPEN },
                }],
            },
            {
                AND: [{
                    statusUpdatedAt: null,
                    statusReopenedCounter_not: 0,
                    status: { id: STATUS_IDS.OPEN },
                }],
            },
        ],
    }

    async connect () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async getCountBrokenTickets () {
        this.countTicketToChange = await Ticket.count(this.context, this.where)
    }

    async fixBrokenTickets () {
        let changedTicketCounter = 0

        while (this.countTicketToChange > changedTicketCounter) {
            const ticketsToChange = await Ticket.getAll(this.context, this.where, { first: this.chunkSize, skip: changedTicketCounter, sortBy: ['createdAt_ASC'] })

            if (isEmpty(ticketsToChange)) break
            console.info(`[INFO] Following tickets will be fixed (${ticketsToChange.length}): [${ticketsToChange.map(ticket => `"${ticket.id}"`).join(', ')}]`)

            changedTicketCounter += ticketsToChange.length

            for (const ticket of ticketsToChange) {
                try {
                    // Last ChangeTicket with updated status
                    const [ticketChange] = await TicketChange.getAll(this.context, {
                        ticket: { id: ticket.id },
                        statusIdFrom_not: null,
                        statusIdTo_not: null,
                    }, {
                        sortBy: ['createdAt_DESC'],
                        first: 1,
                    })

                    if (ticketChange) {
                        // In Ticket set "statusUpdatedAt" from "createdAt" last ChangeTicket with updated status
                        await Ticket.update(this.context, ticket.id, {
                            dv: 1,
                            sender: { fingerprint: 'fixTicketScript', dv: 1 },
                            statusUpdatedAt: ticketChange.createdAt,
                        })
                        this.successTicketChanged++
                        console.info(`[INFO] Updated ticket: (${ticket.id})`)
                    } else {
                        this.passedTicketChanged++
                        console.info(`[INFO] Not changed status ticket: (${ticket.id})`)
                    }
                } catch (error) {
                    this.errorTicketChanged++
                    console.info(`[INFO] Failed to update Ticket with id: (${ticket.id})`)
                }
            }
        }
    }
}

const fixTickets = async () => {
    const fixer = new FixTicketsClientNameClientPhone()
    console.info('[INFO] Connecting to database...')
    await fixer.connect()
    console.info('[INFO] Finding broken tickets...')
    await fixer.getCountBrokenTickets()
    console.info(`[INFO] Found ${fixer.countTicketToChange} broken tickets...`)
    await fixer.fixBrokenTickets()
    console.info('[INFO] Broken tickets are fixed...')
    console.info(`[INFO] SUCCESS: ${fixer.successTicketChanged}`)
    console.info(`[INFO] PASSED: ${fixer.passedTicketChanged}`)
    console.info(`[INFO] ERROR: ${fixer.errorTicketChanged}`)
    console.info(`[INFO] ALL: ${fixer.countTicketToChange}`)
}

fixTickets().then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
})
