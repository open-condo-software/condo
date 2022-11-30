const path = require('path')
const faker = require('faker')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { BillingIntegration } = require('@condo/domains/billing/utils/serverSchema')

class AppsGenerator {
    context = null
    constructor ({ category, amount, withFrames }) {
        this.category = category.toUpperCase()
        this.amount = amount
        this.withFrames = withFrames
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

    async generateMiniApps () {
        console.info(`[INFO] Generating ${this.amount} MiniApps of ${this.category} category...`)
        for (let i = 0; i < this.amount; ++i) {
            if (this.category === 'BILLING') {
                await BillingIntegration.create(this.context, {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'generator' },
                    name: `${faker.company.companyName(0)} billing`,
                    instruction: faker.lorem.paragraphs(5),
                })
            }
        }
    }
}