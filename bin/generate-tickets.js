const { demoProperty } = require('./constants')
const { Ticket, TicketStatus, TicketClassifier } = require('@condo/domains/ticket/utils/testSchema')
const { Property, createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { Organization } = require('@condo/domains/organization/utils/testSchema')
const { User } = require('@condo/domains/user/utils/testSchema')
const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const moment = require('moment')
const { Client } = require('pg')
const client = new Client(process.env.DATABASE_URL)
client.connect()

const faker = require('faker')

const TICKET_OTHER_SOURCE_ID = '7da1e3be-06ba-4c9e-bba6-f97f278ac6e4'


const Data = {
    property: null,
    organizationId: null,
    propertyId: null,
    userId: null,
    statuses: {},
    classifiers: {
        lvlOne: {},
        lvlTwo: {},
        lvlThree: {},
    },
}

const createProperty = async (admin) => {
    const [organization] = await Organization.getAll(admin)
    Data.organizationId = organization.id
    const [existedProperty] = await Property.getAll(admin)
    if (existedProperty) {
        return
    }
    const { address, addressMeta, map } = demoProperty
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    await createTestProperty(admin, organization, {
        sender,
        address,
        addressMeta,
        map,
    })
}

const loadUser = async (admin) => {
    const [user] = await User.getAll(admin, {
        name_not_in: ['Admin', 'JustUser'],
    })
    console.log('user', user)
    Data.userId = user.id
}

const loadModels = async (admin) => {
    Data.statuses = await TicketStatus.getAll(admin)
    const [property] = await Property.getAll(admin)
    Data.propertyId = property.id
    Data.property = property.map
    const classifiers1 = await TicketClassifier.getAll(admin, { parent_is_null: true })
    Data.classifiers.lvlOne = Object.fromEntries(classifiers1.map(({ id, name }) => ([ id, { id, name } ])))
}

const getUnit = () => {
    const result = { section: null, floor: null, unit: null }
    const section = Data.property.sections[faker.datatype.number({ min: 0, max: Data.property.sections.length - 1 })]
    result.section = section.name
    const floor = section.floors[faker.datatype.number({ min: 0, max: section.floors.length - 1 })]
    result.floor = floor.name
    const unit = floor.units[faker.datatype.number({ min: 0, max: floor.units.length - 1 })]
    result.unit = unit.label
    return result
}

const getProblem = () => {
    const start = Object.values(Data.classifiers.lvlOne)
    return start[faker.datatype.number({ min: 0, max: start.length - 1 })]
}

const generateTicket = async (client, dayStamp) => {
    const unit = getUnit()
    const problem = getProblem()
    const status = Data.statuses[faker.datatype.number({ min: 0, max: Data.statuses.length - 1 })]
    const data = {
        dv: 1,
        sender: { dv: 1, fingerprint: 'import' },
        clientName: `${faker.name.firstName()} ${faker.name.lastName()}`,
        clientEmail: faker.internet.email(),
        clientPhone: faker.phone.phoneNumber(),
        details: faker.lorem.sentence(),
        entranceName: unit.section,
        floorName: unit.floor,
        unitName: unit.unit,
        source: { connect: { id: TICKET_OTHER_SOURCE_ID } },
        classifier: { connect: { id: problem.id } },
        // classifier: { connect: { id: problem.lvl1.id } },
        operator: { connect: { id: Data.userId } },
        assignee: { connect: { id: Data.userId } },
        executor: { connect: { id: Data.userId } },
        isEmergency: faker.datatype.boolean(),
        isPaid: faker.datatype.boolean(),
        organization: { connect: { id: Data.organizationId } },
        property:  { connect: { id: Data.propertyId } },
        status: { connect: { id: status.id } },
    }
    const result = await Ticket.create(client, data)
    await setCreatedBy(result.id, dayStamp)
}


const ticketsToGeneratePerDay = [20, 50]

const setCreatedBy = async (id, date) => {
    await client.query(' Update "Ticket" SET "createdAt" = $1 WHERE id=$2 ', [
        moment(date).utc().format('YYYY-MM-DD HH:mm:ss'),
        id,
    ])
}

const createTickets = async () => {
    let counter = 0
    const admin = await makeLoggedInAdminClient()
    await createProperty(admin)
    await loadUser(admin)
    await loadModels(admin)
    const dayStart = moment().utc().startOf('year')
    const dayEnd = moment().utc()
    let current = dayStart.add(6, 'hours')
    let emergencyBreak = 10000
    do {
        const arr = Array(faker.datatype.number({ min: ticketsToGeneratePerDay[0], max: ticketsToGeneratePerDay[1] })).fill('')
        for (const _ of arr) {
            await generateTicket(admin, current.valueOf())
        }
        current = current.add(1, 'day')
    } while (--emergencyBreak > 0 && current < dayEnd)
}

createTickets().then(() => {
    console.log('All done')
}).catch(err => {
    console.error('Failed to done', err)
})
