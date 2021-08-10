/**
 * This function generates the billingReceipts for billingIntegrationOrganizationContext
 * Usage: generate-receipts <contextId>
 * Note: contextId can be obtained thorough admin panel
 */

const { Ticket, TicketStatus, TicketClassifierRule } = require('@condo/domains/ticket/utils/serverSchema')
const { BillingProperty, BillingAccount, BillingReceipt, BillingIntegrationOrganizationContext } = require('@condo/domains/billing/utils/serverSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { demoProperties } = require('./constants')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const { User } = require('@condo/domains/user/utils/serverSchema')
const moment = require('moment')
const faker = require('faker')
const path = require('path')
const { buildFakeAddressMeta } = require('@condo/domains/common/utils/testSchema/factories')
const { Client } = require('pg')
const { GraphQLApp } = require('@keystonejs/app-graphql')

const TICKET_OTHER_SOURCE_ID = '7da1e3be-06ba-4c9e-bba6-f97f278ac6e4'
const PROPERTY_QUANTITY = 10
const ACCOUNTS_PER_PROPERTY = { min: 80, max: 140 }

class ReceiptsGenerator {

    property = null
    organization = null
    user = null

    statuses = []
    classifiers = []

    ticketsByDay = {}
    context = null

    constructor ({ billingContextId, detailLevel, propertyQuantity, accountsPerProperty }) {
        this.billingContextId = billingContextId
        this.detailLevel = detailLevel
        this.propertyQuantity = propertyQuantity,
        this.accountsPerProperty = accountsPerProperty,
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

    async generate () {
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
                // we cannot generate tickets in parallel as their autoincrement number will fail to fill
                await this.generateTicket(current.valueOf())
                console.log(`ticket ${++counter} `)
            }
            current = current.add(1, 'day')
        } while (--maxTickets > 0 && current < dayEnd)
    }

    async generateTicket (timeStamp) {
        const unit = this.unit
        const problem = this.problem
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
            classifierRule: { connect: { id: problem.id } },
            placeClassifier: { connect: { id: problem.place.id } },
            categoryClassifier: { connect: { id: problem.category.id } },
            problemClassifier: { connect: { id: problem.problem.id } },
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

    async generateProperty () {
        const [billingProperty] = await BillingProperty.create(
            this.context,
            {
                context: { connect: { id: this.billingContextId } },
                address: buildFakeAddressMeta().value,
                importId: faker.random.uuid,
                globalId: faker.random.uuid(),
                meta: {},
                raw: {},
            }
        )
        return billingProperty
    }
	
    async generateBillingAccountsForProperty (property) {
        const { id } = property
        return [0, 0, 0]
    }
	
    /**
	 * This function checks context, generates billingProperties and generates billingAccounts
	 * @return {Promise<void>}
	 */
    async prepareModels () {
        const [billingContext] = await BillingIntegrationOrganizationContext.getAll(this.context, { id: this.billingContextId })
        if (!billingContext) {
            throw new Error('Provided billingContextId was invalid')
        }
		
        const properties = []
        for (let i = 0; i < this.propertyQuantity; ++i) {
            const currentProperty = await this.generateProperty()
            properties.push(currentProperty)
        }
        this.properties = properties

        const billingAccounts = []
        for (let i = 0; i < properties.length; ++i) {
            const billingAccountsForProperty = this.generateBillingAccountsForProperty(properties[i])
            billingAccounts.push(billingAccountsForProperty)
        }
        this.billingAccounts = billingAccounts.flat()
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

const createReceipts = async ([billingContextId]) => {
    if (!billingContextId) {
        throw new Error('No billingContextId was provided – please use like this: yarn generate-receipts <contextId>')
    }

    const ReceiptsManager = new ReceiptsGenerator({ billingContextId: billingContextId, detailLevel: 1 })
    console.time('keystone')
    await ReceiptsManager.connect()
    console.timeEnd('keystone')

    for (const info of demoProperties) {
        try {
            console.log(`[START] ${info.address}`)
            await ReceiptsManager.generate(info)
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

createReceipts(process.argv.slice(2)).then(() => {
    console.log('All done')
    process.exit(0)
}).catch(err => {
    console.error('Failed to done', err)
})
