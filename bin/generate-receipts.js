/**
 * This function generates the billingReceipts for billingIntegrationOrganizationContext
 * Usage: generate-receipts <contextId>
 * Note: contextId can be obtained thorough admin panel
 */

const { BillingProperty, BillingAccount, BillingReceipt, BillingIntegrationOrganizationContext } = require('@condo/domains/billing/utils/serverSchema')
const faker = require('faker')
const path = require('path')
const { buildFakeAddressMeta } = require('@condo/domains/common/utils/testSchema/factories')
const { GraphQLApp } = require('@keystonejs/app-graphql')

const PROPERTY_QUANTITY = 10
const ACCOUNTS_PER_PROPERTY_DISTRIBUTION = { min: 80, max: 140 }
const PERIOD = '2021-08-01'
const TO_PAY_DISTRIBUITION = { min: 1200, max: 8500 }

const DV = 1
const SENDER = { dv: DV, fingerprint: faker.random.alphaNumeric(8) }
const BASE_JSON = { dv: DV, sender: SENDER }


class ReceiptsGenerator {

    context = null

    constructor ({ billingContextId, detailLevel, propertyQuantity, accountsPerProperty, toPay, period }) {
        this.billingContextId = billingContextId
        this.detailLevel = detailLevel
        this.propertyQuantity = propertyQuantity,
        this.accountsPerProperty = accountsPerProperty,
        this.toPay = toPay,
        this.period = period
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
        await this.generateReceipts()
    }

    async generateProperty () {
        return await BillingProperty.create(
            this.context,
            {
                dv: DV,
                sender: SENDER,
                context: { connect: { id: this.billingContextId } },
                address: buildFakeAddressMeta().value,
                importId: faker.datatype.uuid(),
                globalId: faker.datatype.uuid(),
                meta: {},
                raw: {},
            }
        )
    }
	
    async generateBillingAccountsForProperty (property) {
        const { id } = property
        const accountsToGenerate = Math.floor(Math.random() * (this.accountsPerProperty.max - this.accountsPerProperty.min + 1)) + this.accountsPerProperty.min
        console.info(`[INFO] ${accountsToGenerate} would be generated for ${property.address}`)
        
        const billingAccounts = []
        for (let i = 0; i < accountsToGenerate; ++i) {
            const billingAccount = await BillingAccount.create(
                this.context,
                {
                    dv: DV,
                    sender: SENDER,
                    context: { connect: { id: this.billingContextId } },
                    property: { connect: { id: id } },
                    importId: faker.datatype.uuid(),
                    globalId: faker.helpers.replaceSymbols('##??########'),
                    number: faker.helpers.replaceSymbols('############'),
                    unitName: (i + 1).toString(),
                    meta: BASE_JSON,
                    raw: BASE_JSON,
                }
            )
            billingAccounts.push(billingAccount)
        }

        return billingAccounts
    }

    async generateReceipts () {

        // Gets somewhat like normal distribution using central limit theorem
        function _gaussianRand () {
            let rand = 0
            for (let i = 0; i < 6; i += 1) {
                rand += Math.random()
            }
            return rand / 6
        }
        
        console.info('[INFO] Generating receipts...')
        if (!this.billingAccounts) {
            throw new Error('Cant generate receipts! No billing accounts. Please check that this.prepareModels() is ran before this.generateReceipts()')
        }

        const toBeGenerated = this.billingAccounts.length

        // Right now we support only one payment organization
        // The case when there are multiple payment organizations is possible
        // todo(toplenboren) create multiple payment receipts for different orgs for same account
        const PAYMENT_ORGANIZATION = {
            tin: faker.datatype.number().toString(),
            iec: faker.datatype.number().toString(),
            bic: faker.datatype.number().toString(),
            bankAccount: faker.datatype.number().toString(),
        }

        let currentProgress = 0 // in percentage

        setInterval(() => {
            process.stdout.write(`\r${currentProgress}%`)
        }, 50)

        for (let i = 0; i < toBeGenerated; ++i) {
            switch (this.detailLevel) {
                case 1:
                    await BillingReceipt.create(this.context, {
                        dv: DV,
                        sender: SENDER,
                        context: { connect: { id: this.billingContextId } },
                        property: { connect: { id: this.billingAccounts[i].property.id } },
                        account: { connect: { id: this.billingAccounts[i].id } },
                        importId: faker.datatype.uuid(),
                        toPay: (Math.floor(this.toPay.min + _gaussianRand() * (this.toPay.max - this.toPay.min + 1))).toString(),
                        period: this.period,
                        recipient: PAYMENT_ORGANIZATION,
                        raw: BASE_JSON,
                    })
                    break
                default:
                    throw new Error(`Cant generate receipts! Detail level is wrong. Should be 1. Got ${this.detailLevel}`)
            }
            currentProgress = Math.floor(i * 100 / toBeGenerated)
            //console.info(`[INFO] ${Math.floor(i * 100 / toBeGenerated)}%`)
        }
    }

    /**
	 * This function checks context, generates billingProperties and generates billingAccounts
	 */
    async prepareModels () {
        try {
            const [billingContext] = await BillingIntegrationOrganizationContext.getAll(this.context, { id: this.billingContextId })
            if (billingContext.length === 0) throw new Error('Provided billingContextId not found')
        } catch (e) {
            throw new Error('Provided billingContextId was invalid')
        }

        console.info('[INFO] Generating properties...')
        const properties = []
        for (let i = 0; i < this.propertyQuantity; ++i) {
            const currentProperty = await this.generateProperty()
            properties.push(currentProperty)
        }
        this.properties = properties

        console.info('[INFO] Generating accounts...')
        const billingAccounts = []
        for (let i = 0; i < properties.length; ++i) {
            const billingAccountsForProperty = await this.generateBillingAccountsForProperty(properties[i])
            billingAccounts.push(billingAccountsForProperty)
        }
        this.billingAccounts = billingAccounts.flat()
    }
}

const createReceipts = async ([billingContextId]) => {
    if (!billingContextId) {
        throw new Error('No billingContextId was provided – please use like this: yarn generate-receipts <contextId>')
    }

    const ReceiptsManager = new ReceiptsGenerator({
        billingContextId: billingContextId,
        detailLevel: 1,
        propertyQuantity: PROPERTY_QUANTITY,
        accountsPerProperty: ACCOUNTS_PER_PROPERTY_DISTRIBUTION,
        period: PERIOD,
        toPay: TO_PAY_DISTRIBUITION,
    })

    console.time('keystone')
    await ReceiptsManager.connect()
    console.timeEnd('keystone')

    await ReceiptsManager.generate()
}

if (process.env.NODE_ENV !== 'development') {
    console.log('NODE_ENV needs to be set to "development"')
    process.exit(1)
}

createReceipts(process.argv.slice(2)).then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch(err => {
    console.error('Failed to done', err)
})
