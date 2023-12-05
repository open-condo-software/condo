const path = require('path')

const { faker } = require('@faker-js/faker')
const random = require('lodash/random')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { AcquiringIntegration } = require('@condo/domains/acquiring/utils/serverSchema')
const { BillingIntegration } = require('@condo/domains/billing/utils/serverSchema')
const { B2BApp } = require('@condo/domains/miniapp/utils/serverSchema')

const bannerVariants = [
    { bannerColor: '#9b9dfa', bannerTextColor: 'WHITE' },
    { bannerColor: 'linear-gradient(90deg, #4cd174 0%, #6db8f2 100%)', bannerTextColor: 'BLACK' },
    { bannerColor: '#d3e3ff', bannerTextColor: 'BLACK' },
]

function randomChoice (choices) {
    return choices[random(choices.length - 1)]
}

class AppsGenerator {
    context = null

    constructor ({ category, amount, appUrl }) {
        this.category = category.toUpperCase()
        this.amount = amount
        this.appUrl = appUrl
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
                    name: `${faker.company.companyName(0)} billing`,
                    shortDescription: faker.commerce.productDescription(),
                    detailedDescription: faker.lorem.paragraphs(2),
                    targetDescription: faker.company.catchPhrase(),
                    contextDefaultStatus: this.appUrl ? 'Finished' : 'InProgress',
                    receiptsLoadingTime: `${faker.datatype.number({ min: 10, max: 100 })} days`,
                    currencyCode: 'RUB',
                    ...randomChoice(bannerVariants),
                    ...this.appUrl
                        ? { appUrl: this.appUrl, setupUrl: `${this.appUrl.replace(/\/+$/, '')}/setup` }
                        : { instruction: faker.lorem.paragraphs(2) },
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
                    hostUrl: faker.internet.url(),
                    explicitFeeDistributionSchema: [],
                    setupUrl: this.appUrl ? `${this.appUrl.replace(/\/+$/, '')}/setup` : null,
                })
            } else {
                await B2BApp.create(this.context, {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'generator' },
                    name: `${faker.company.companyName(0)} B2B app`,
                    developer: faker.company.name(),
                    shortDescription: faker.commerce.productDescription(),
                    detailedDescription: faker.lorem.paragraphs(5),
                    contextDefaultStatus: this.appUrl ? 'Finished' : 'InProgress',
                    category: this.category,
                    isHidden: false, isGlobal: false,
                    appUrl: this.appUrl,
                })
            }
        }
    }
}

const generateMiniapps = async ([category, amount, appUrl]) => {
    const totalAmount = parseInt(amount)

    const generator = new AppsGenerator({ category, amount: totalAmount, appUrl })
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
