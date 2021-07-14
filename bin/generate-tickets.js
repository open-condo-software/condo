const { Ticket, TicketStatus, TicketClassifier } = require('@condo/domains/ticket/utils/serverSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { demoProperty } = require('./constants')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const { User } = require('@condo/domains/user/utils/serverSchema')
const moment = require('moment')
const faker = require('faker')
const path = require('path')
const { Client } = require('pg')
const TICKET_OTHER_SOURCE_ID = '7da1e3be-06ba-4c9e-bba6-f97f278ac6e4'
class TicketGenerator {

    property = null
    organization = null
    user = null

    statuses = []
    classifiers = []

    ticketsByDay = {}
    context = null

    constructor ({ ticketsByDay = { min: 20, max: 50 } }) {
        this.ticketsByDay = ticketsByDay
        this.pg = new Client(process.env.DATABASE_URL)
        this.pg.connect()
    }

    async connect () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        await keystone.prepare({ apps, distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async generate () {
        await this.connect()
        await this.prepareModels()
        await this.generateTickets()
    }

    async generateTickets () {
        const dayStart = moment().utc().startOf('year')
        const dayEnd = moment().utc()
        let current = dayStart.add(6, 'hours')
        let maxTickets = 10000
        let counter = 0
        do {
            const arr = Array(faker.datatype.number(this.ticketsByDay)).fill('')
            for (const _ of arr) {
                await this.generateTicket(current.valueOf())
                console.log(`ticket ${++counter} `)
            }
            current = current.add(1, 'day')
        } while (--maxTickets > 0 && current < dayEnd)
    }

    async generateTicket (timeStamp) {
        const unit = this.unit
        const data = {
            dv: 1,
            sender: { dv: 1, fingerprint: 'import' },
            clientName: `${faker.name.firstName()} ${faker.name.lastName()}`,
            clientEmail: faker.internet.email(),
            clientPhone: faker.phone.phoneNumber('+7922#######'),
            details: faker.lorem.sentence(),
            sectionName: unit.section,
            floorName: unit.floor,
            unitName: unit.unit,
            source: { connect: { id: TICKET_OTHER_SOURCE_ID } },
            classifier: { connect: { id: this.problem.id } },
            operator: { connect: { id: this.user.id } },
            assignee: { connect: { id: this.user.id } },
            executor: { connect: { id: this.user.id } },
            isEmergency: faker.datatype.boolean(),
            isPaid: faker.datatype.boolean(),
            organization: { connect: { id: this.organization.id } },
            property:  { connect: { id: this.property.id } },
            status: { connect: { id: this.status.id } },
        }
        const result = await Ticket.create(this.context, data)
        await this.setCreatedAt(result.id, timeStamp)
    }

    async prepareModels () {
        this.statuses = await TicketStatus.getAll(this.context, { organization_is_null: true })
        this.classifiers = await TicketClassifier.getAll(this.context, { parent_is_null: true })
        const [property] = await Property.getAll(this.context, {})
        this.property = property
        const [user] = await User.getAll(this.context, { name_not_in: ['Admin', 'JustUser'] })
        this.user = user
        const [organization] = await Organization.getAll(this.context, {})
        this.organization = organization
        if (!this.organization) {
            throw new Error('Please create user with organization first')
        }
        if (!this.property) {
            const { address, addressMeta, map } = demoProperty
            const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
            const newProperty = await Property.create(this.context, {
                dv: 1,
                sender,
                address,
                type: 'building',
                organization: { connect: { id: this.organization.id } },
                addressMeta,
                map,
            })
            this.property = newProperty
        }
        console.log(this.property)
    }

    get unit () {
        const result = { section: null, floor: null, unit: null }
        const section = this.property.map.sections[faker.datatype.number({ min: 0, max: this.property.map.sections.length - 1 })]
        result.section = section.name
        const floor = section.floors[faker.datatype.number({ min: 0, max: section.floors.length - 1 })]
        result.floor = floor.name
        const unit = floor.units[faker.datatype.number({ min: 0, max: floor.units.length - 1 })]
        result.unit = unit.label
        return result
    }

    get problem () {
        return this.classifiers[faker.datatype.number({ min: 0, max: this.classifiers.length - 1 })]
    }

    get status () {
        return this.statuses[faker.datatype.number({ min: 0, max: this.statuses.length - 1 })]
    }

    async setCreatedAt (ticketId, date) {
        await this.pg.query(' Update "Ticket" SET "createdAt" = $1 WHERE id=$2 ', [
            moment(date).utc().format('YYYY-MM-DD HH:mm:ss'),
            ticketId,
        ])
    }

}

const createTickets = async () => {
    const TicketManager = new TicketGenerator({ ticketsByDay: { min: 20, max: 50 } })
    await TicketManager.generate()
}

if (process.env.NODE_ENV !== 'development') {
    console.log('NODE_ENV needs to be set to "development"')
    process.exit(1)
}

createTickets().then(() => {
    console.log('All done')
    process.exit(0)
}).catch(err => {
    console.error('Failed to done', err)
})
