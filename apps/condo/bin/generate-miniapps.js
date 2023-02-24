const path = require('path')

const faker = require('faker')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/test.utils')

const { AcquiringIntegration } = require('@condo/domains/acquiring/utils/serverSchema')
const { BillingIntegration } = require('@condo/domains/billing/utils/serverSchema')
const { B2BApp } = require('@condo/domains/miniapp/utils/serverSchema')

class AppsGenerator {
    context = null

    constructor ({ category, amount, withFrames, appUrl }) {
        this.category = category.toUpperCase()
        this.amount = amount
        this.withFrames = withFrames
        this.appUrl = appUrl || 'http://localhost:3001'
    }

    async connect () {
        console.info('[INFO] Connecting to database...')
        const { keystone } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async generateMiniApps () {
        console.info(`[INFO] Generating ${this.amount} MiniApps of ${this.category} category...`)
        for (let i = 0; i < this.amount; ++i) {
            if (this.category === 'BILLING') {
                await BillingIntegration.create(this.context, {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'generator' },
                    developer: faker.company.companyName(),
                    name: `${faker.company.companyName(0)} billing`,
                    shortDescription: faker.commerce.productDescription(),
                    detailedDescription: faker.lorem.paragraphs(5),
                    contextDefaultStatus: this.withFrames ? 'Finished' : 'InProgress',
                    currencyCode: 'RUB',
                    appUrl: this.withFrames ? this.appUrl : undefined,
                })
            } else if (this.category === 'ACQUIRING') {
                const billings = await BillingIntegration.getAll(this.context, {}, { first: 1 })
                if (!billings.length || !billings[0].id) {
                    throw new Error('No billing to connect')
                }
                await AcquiringIntegration.create(this.context, {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'generator' },
                    name: `${faker.company.companyName(0)} acquiring`,
                    developer: faker.company.companyName(),
                    shortDescription: faker.commerce.productDescription(),
                    detailedDescription: faker.lorem.paragraphs(5),
                    hostUrl: faker.internet.url(),
                    explicitFeeDistributionSchema: [],
                    appUrl: this.withFrames ? this.appUrl : undefined,
                })
            } else {
                await B2BApp.create(this.context, {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'generator' },
                    name: `${faker.company.companyName(0)} B2B app`,
                    developer: faker.company.companyName(),
                    shortDescription: faker.commerce.productDescription(),
                    detailedDescription: faker.lorem.paragraphs(5),
                    contextDefaultStatus: this.withFrames ? 'Finished' : 'InProgress',
                    category: this.category,
                    isHidden: false, isGlobal: false,
                    appUrl: this.withFrames ? this.appUrl : undefined,
                })
            }
        }
    }
}

const generateMiniapps = async ([category, amount, framed, appUrl]) => {
    const totalAmount = parseInt(amount)
    const withFrames = framed && framed.toUpperCase() === 'TRUE'

    const generator = new AppsGenerator({ category, amount: totalAmount, withFrames, appUrl })
    await generator.connect()
    await generator.generateMiniApps()
}

generateMiniapps(process.argv.slice(2)).then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch(err => {
    console.error('Failed to done', err)
    process.exit(1)
})
