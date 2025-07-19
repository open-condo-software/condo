const path = require('path')

const { faker } = require('@faker-js/faker')
const { GraphQLApp } = require('@open-keystone/app-graphql')
const get = require('lodash/get')

const { Contact } = require('@condo/domains/contact/utils/serverSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { createTestEmail, createTestPhone } = require('@condo/domains/user/utils/testSchema')


const DV = 1
const SENDER = { dv: DV, fingerprint: faker.random.alphaNumeric(8) }

class ContactGenerator {
    constructor ({ propertyId, amount }) {
        this.propertyId = propertyId
        this.amount = amount
    }
    async connect () {
        console.info('[INFO] Connecting to database...')
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async generateContacts () {
        const [property] = await Property.getAll(this.context, { id: this.propertyId })
        if (!property) {
            throw new Error('Property with specified it was not found')
        }
        const units = get(property, 'unitsCount', 5)
        const organization = property.organization.id
        for (let i = 0; i < this.amount; i++) {
            await Contact.create(this.context, {
                dv: DV,
                sender: SENDER,
                property: { connect: { id: this.propertyId } },
                organization: { connect: { id: organization } },
                unitName: String((i % units) + 1),
                name: faker.name.firstName(),
                email: createTestEmail(),
                phone: createTestPhone(),
            })
        }
    }
}

const createContacts = async ([propertyId, amount]) => {
    if (!propertyId || !amount) {
        throw new Error('No propertyId was provided – please use like this: yarn workspace @app/condo node ./bin/generate-contacts.js <propertyId> <amount>')
    }
    const ContactManager = new ContactGenerator({ propertyId, amount })
    console.time('keystone')
    await ContactManager.connect()
    console.timeEnd('keystone')
    await ContactManager.generateContacts()
}

if (process.env.NODE_ENV !== 'development') {
    console.log('NODE_ENV needs to be set to "development"')
    process.exit(1)
}

createContacts(process.argv.slice(2))
    .then(() => {
        console.log('\r\n')
        console.log('All done')
        process.exit(0)
    }).catch((err) => {
        console.error('Failed to done', err)
    })