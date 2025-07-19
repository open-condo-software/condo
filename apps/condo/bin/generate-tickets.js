
const path = require('path')

const { faker } = require('@faker-js/faker')
const { GraphQLApp } = require('@open-keystone/app-graphql')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const { Client } = require('pg')

const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { DEFERRED_STATUS_TYPE } = require('@condo/domains/ticket/constants')
const {
    Ticket,
    TicketStatus,
    TicketClassifier,
    TicketComment,
} = require('@condo/domains/ticket/utils/serverSchema')
const { User } = require('@condo/domains/user/utils/serverSchema')

const { demoProperties } = require('./constants')
dayjs.extend(utc)

const TICKET_OTHER_SOURCE_ID = '7da1e3be-06ba-4c9e-bba6-f97f278ac6e4'
class TicketGenerator {

    property = null
    organization = null
    user = null

    statuses = []
    classifiers = []

    ticketsByDay = {}
    context = null

    constructor ({ ticketsByDay = { min: 20, max: 50 }, organizationId }) {
        this.ticketsByDay = ticketsByDay
        this.organizationId = organizationId
        this.pg = new Client(process.env.DATABASE_URL)
        this.pg.connect()
    }

    async connect () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        // we need only apollo
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async generate (propertyInfo) {
        await this.prepareModels(propertyInfo)
        await this.generateTickets()
    }

    async generateTickets () {
        const dayStart = dayjs().startOf('year')
        const dayEnd = dayjs()
        let current = dayStart.add(6, 'hours')
        let maxTickets = 100
        let counter = 0
        do {
            const arr = Array(faker.datatype.number(this.ticketsByDay)).fill('')
            for (const _ of arr) {
                // we cannot generate tickets in parallel as their autoincrement number will fail to fill
                await this.generateTicket(current.valueOf())
                console.log(`ticket ${++counter} `)
            }
            current = current.add(1, 'day')
        } while (--maxTickets > 0 && current < dayEnd)
    }

    async generateTicket (timeStamp) {
        const unit = this.unit
        const classifier = this.pickRandomClassifier()
        const status = this.pickRandomStatus()
        const data = {
            dv: 1,
            sender: { dv: 1, fingerprint: 'import' },
            clientName: `${faker.name.firstName()} ${faker.name.lastName()}`,
            clientEmail: faker.internet.email(),
            clientPhone: faker.phone.number('+7922#######'),
            details: faker.lorem.sentence(),
            sectionName: unit.section,
            floorName: unit.floor,
            unitName: unit.unit,
            source: { connect: { id: TICKET_OTHER_SOURCE_ID } },
            classifier: { connect: { id: classifier.id } },
            operator: { connect: { id: this.user.id } },
            assignee: { connect: { id: this.user.id } },
            executor: { connect: { id: this.user.id } },
            isEmergency: faker.datatype.boolean(),
            isWarranty: faker.datatype.boolean(),
            isPayable: faker.datatype.boolean(),
            organization: { connect: { id: this.organization.id } },
            property:  { connect: { id: this.property.id } },
            status: { connect: { id: status.id } },
            deadline: faker.date.between(dayjs().subtract(2, 'week').toISOString(), dayjs().add(2, 'week').toISOString()).toISOString(),
        }
        if (status.type === DEFERRED_STATUS_TYPE) {
            data.deferredUntil = dayjs().add(1, 'day').toISOString()
        }
        const result = await Ticket.create(this.context, data)
        await this.setCreatedAt(result.id, timeStamp)
        await this.createTicketComments(result.id, faker.datatype.number({ min: 0, max: 5 }))
    }

    async createTicketComments (ticketId, number) {
        new Array(number).fill('').map(async _ => {
            await TicketComment.create(this.context, {
                dv: 1,
                sender: { dv: 1, fingerprint: 'import' },
                ticket: { connect: { id: ticketId } },
                user: { connect: { id: this.user.id } },
                content: faker.lorem.paragraph(),
            })
        })
    }

    async prepareModels (propertyInfo) {
        this.statuses = await TicketStatus.getAll(this.context, { organization_is_null: true })
        this.classifiers = await TicketClassifier.getAll(this.context, { })
        const [property] = await Property.getAll(this.context, { address: propertyInfo.address, organization: { id: this.organizationId } })
        if (property) {
            this.property = property
        }

        const [organization] = await Organization.getAll(this.context, {
            id: this.organizationId,
        })
        this.organization = organization

        const [user] = await User.getAll(this.context, { name_not_in: ['JustUser'] })
        this.user = user

        if (!this.organization) {
            throw new Error('Please create user with organization first')
        }
        if (!property) {
            const { address, addressMeta, map } = propertyInfo
            const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
            this.property = await Property.create(this.context, {
                dv: 1,
                sender,
                address,
                type: 'building',
                organization: { connect: { id: this.organization.id } },
                addressMeta,
                map,
            })
        }
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

    pickRandomClassifier () {
        return this.classifiers[faker.datatype.number({ min: 0, max: this.classifiers.length - 1 })]
    }

    pickRandomStatus () {
        return this.statuses[faker.datatype.number({ min: 0, max: this.statuses.length - 1 })]
    }

    async setCreatedAt (ticketId, date) {
        await this.pg.query(' Update "Ticket" SET "createdAt" = $1 WHERE id=$2 ', [
            dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
            ticketId,
        ])
    }

}

const createTickets = async () => {
    const [organizationId] = process.argv.slice(2)

    const TicketManager = new TicketGenerator({
        ticketsByDay: { min: 20, max: 50 },
        organizationId,
    })
    console.time('keystone')
    await TicketManager.connect()
    console.timeEnd('keystone')
    for (const info of demoProperties) {
        try {
            console.log(`[START] ${info.address}`)
            await TicketManager.generate(info)
            console.log(`[END] ${info.address}`)
        } catch (error) {
            console.log('error', error)
            console.log(`[SKIP] ${info.address}`)
        }
    }
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
