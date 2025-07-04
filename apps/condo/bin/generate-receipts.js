/**
 * This function generates the billingReceipts for billingIntegrationOrganizationContext
 * Usage: generate-receipts <contextId>
 * Note: contextId can be obtained thorough admin panel
 */

const path = require('path')

const { faker } = require('@faker-js/faker')
const { GraphQLApp } = require('@open-keystone/app-graphql')
const dayjs = require('dayjs')

const { getPreviousPeriods } = require('@condo/domains/billing/utils/period')
const { BillingProperty, BillingAccount, BillingReceipt, BillingIntegrationOrganizationContext } = require('@condo/domains/billing/utils/serverSchema')
const { buildFakeAddressMeta } = require('@condo/domains/property/utils/testSchema/factories')

const PROPERTY_QUANTITY = 10
const AVAILABLE_LEVELS = {
    base: '1',
    toPayDetails: '1+',
    withServices: '2',
    withServiceDetails: '2+',
}
const ACCOUNTS_PER_PROPERTY_DISTRIBUTION = { min: 30, max: 70 }
const PERIODS_AMOUNT = 3

const TO_PAY_DISTRIBUITION = { min: 1200, max: 8500 }
const SERVICES_DISTRIBUTION = { min: 2, max: 30 }

const DV = 1
const SENDER = { dv: DV, fingerprint: faker.random.alphaNumeric(8) }
const BASE_JSON = { dv: DV, sender: SENDER }
const CURRENT_DATE = dayjs()
const CURRENT_PERIOD = CURRENT_DATE.format('YYYY-MM-01')



class ReceiptsGenerator {

    context = null

    constructor ({ billingContextId, detailLevel, propertyQuantity, accountsPerProperty, toPay, services, periods }) {
        this.billingContextId = billingContextId
        this.detailLevel = detailLevel
        this.propertyQuantity = propertyQuantity
        this.accountsPerProperty = accountsPerProperty
        this.toPay = toPay
        this.periods = periods
        this.services = services
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
            },
            'id address'
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
                },
                'id property { id }'
            )
            billingAccounts.push(billingAccount)
        }

        return billingAccounts
    }

    async generateReceipts () {

        // Gets somewhat like normal distribution using central limit theorem
        function _gaussianRand (attempts = 6) {
            let rand = 0
            for (let i = 0; i < attempts; i += 1) {
                rand += Math.random()
            }
            return rand / attempts
        }

        function _gaussianInt (min, max, attempts = 6) {
            min = Math.ceil(min)
            max = Math.floor(max)
            return Math.floor(_gaussianRand(attempts) * (max - min + 1) + min)
        }

        function _getToPayDetails (charge) {
            const balance = _gaussianInt(-charge, charge * 4, 1)
            const penalty = balance > charge * 2 ? _gaussianInt(0, charge) : 0
            const toPay = `${charge + balance + penalty}.00`
            const toPayDetails = {
                formula: 'charge+balance+penalty',
                charge: `${charge}.00`,
                balance: `${balance}.00`,
                penalty: `${penalty}.00`,
            }
            return {
                toPay,
                toPayDetails,
            }
        }

        function _getDetailedService (servicesAmount, maxCharge) {
            const rand = _gaussianRand(1)
            const service = {}
            service.name = faker.commerce.productName()
            service.id = faker.datatype.uuid()
            if (rand > 0.5) {
                const charge = _gaussianInt(0, maxCharge / servicesAmount)
                const formula = 'charge+recalculation+privilege+penalty'
                const recalculation = _gaussianInt(-charge / 3, charge / 3)
                const privilege = _gaussianRand(1) < 0.3 ? _gaussianInt(-charge / 3, 0) : null
                const penalty = _gaussianRand(1) < 0.3 ? _gaussianInt(0, charge / 3) : null
                const toPay = charge + recalculation + privilege + penalty
                const toPayDetails = {
                    charge: `${charge}.00`,
                    recalculation: `${recalculation}.00`,
                    formula,
                }

                if (penalty !== null) {
                    toPayDetails.penalty = `${penalty}.00`
                }
                if (privilege !== null) {
                    toPayDetails.privilege = `${privilege}.00`
                }

                if (_gaussianRand() > 0.5) {
                    toPayDetails.measure = faker.finance.currencyCode()
                    toPayDetails.tariff = `${_gaussianInt(0, 2000)}.00`
                    toPayDetails.volume = `${_gaussianInt(0, 50) / 13}`
                }

                service.toPay = `${toPay}.00`
                service.toPayDetails = toPayDetails
            } else {
                service.toPay = '00.00'
                if (_gaussianRand() < 0.5) {
                    service.toPayDetails = {
                        formula: 'charge+recalculation+privilege+penalty',
                        privilege: `${_gaussianInt(-500, 500)}.00`,
                    }
                }
            }
            return {
                service,
                toPay: parseInt(service.toPay),
            }
        }
        
        console.info('[INFO] Generating receipts...')
        if (!this.billingAccounts) {
            throw new Error('Cannot generate receipts! No billing accounts. Please check that this.prepareModels() is ran before this.generateReceipts()')
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
        for (let p = 0; p < this.periods.length; p++) {
            for (let i = 0; i < toBeGenerated; ++i) {
                const receipt = {
                    dv: DV,
                    sender: SENDER,
                    context: { connect: { id: this.billingContextId } },
                    property: { connect: { id: this.billingAccounts[i].property.id } },
                    account: { connect: { id: this.billingAccounts[i].id } },
                    importId: faker.datatype.uuid(),
                    period: this.periods[p],
                    recipient: PAYMENT_ORGANIZATION,
                    raw: BASE_JSON,
                }
                switch (this.detailLevel) {
                    case AVAILABLE_LEVELS.base:
                        await BillingReceipt.create(this.context, {
                            ...receipt, toPay: `${_gaussianInt(this.toPay.min, this.toPay.max)}.00`,
                        })
                        break
                    case AVAILABLE_LEVELS.toPayDetails: {
                        const charge = _gaussianInt(this.toPay.min, this.toPay.max)
                        const { toPay, toPayDetails } = _getToPayDetails(charge)
                        await BillingReceipt.create(this.context, {
                            ...receipt,
                            toPay,
                            toPayDetails,
                        })
                        break
                    }
                    case AVAILABLE_LEVELS.withServices: {
                        const servicesAmount = _gaussianInt(this.services.min, this.services.max, 1)
                        const services = []
                        let totalToPay = 0
                        for (let s = 0; s < servicesAmount; s++) {
                            const name = faker.commerce.productName()
                            const id = faker.datatype.uuid()
                            // ~50% of services has toPay = 0.00
                            let toPay = 0
                            if (_gaussianRand() > 0.5) {
                                toPay = _gaussianInt(0, this.toPay.max * 2 / servicesAmount)
                            }
                            totalToPay += toPay
                            services.push({
                                id,
                                name,
                                toPay: `${toPay}.00`,
                            })
                        }
                        const charge = totalToPay
                        const { toPay, toPayDetails } = _getToPayDetails(charge)
                        await BillingReceipt.create(this.context, {
                            ...receipt,
                            services,
                            toPayDetails,
                            toPay,
                        })
                        break
                    }
                    case AVAILABLE_LEVELS.withServiceDetails: {
                        const servicesAmount = _gaussianInt(this.services.min, this.services.max, 1)
                        const services = []
                        let totalToPay = 0
                        for (let s = 0; s < servicesAmount; s++) {
                            const { toPay, service } = _getDetailedService(servicesAmount, this.toPay.max)
                            totalToPay += toPay
                            services.push(service)
                        }
                        const charge = totalToPay
                        const { toPay, toPayDetails } = _getToPayDetails(charge)
                        await BillingReceipt.create(this.context, {
                            ...receipt,
                            services,
                            toPayDetails,
                            toPay,
                        })
                        break
                    }
                    default:
                        throw new Error(`Cannot generate receipts! Detail level is wrong. Should be 1. Got ${this.detailLevel}`)
                }
                currentProgress = Math.floor(i * 100 / toBeGenerated)
                //console.info(`[INFO] ${Math.floor(i * 100 / toBeGenerated)}%`)
            }
        }
        await BillingIntegrationOrganizationContext.update(this.context, this.billingContextId, {
            dv: DV,
            sender: SENDER,
            lastReport: {
                period: this.periods[0],
                finishTime: dayjs().toISOString(),
                totalReceipts: toBeGenerated,
            },
        })
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

const createReceipts = async ([billingContextId, detailsLevel]) => {
    if (!detailsLevel) {
        detailsLevel = AVAILABLE_LEVELS.base
    }
    if (!billingContextId) {
        throw new Error('No billingContextId was provided – please use like this: yarn workspace @app/condo node ./bin/generate-receipts.js <contextId>')
    }
    if (!Object.values(AVAILABLE_LEVELS).includes(detailsLevel)) {
        throw new Error(`Incorrect detailsLevel was provided. Available: ${Object.values(AVAILABLE_LEVELS).join(', ')}`)
    }

    const ReceiptsManager = new ReceiptsGenerator({
        billingContextId: billingContextId,
        detailLevel: detailsLevel,
        propertyQuantity: PROPERTY_QUANTITY,
        accountsPerProperty: ACCOUNTS_PER_PROPERTY_DISTRIBUTION,
        periods: getPreviousPeriods(CURRENT_PERIOD, PERIODS_AMOUNT),
        toPay: TO_PAY_DISTRIBUITION,
        services: SERVICES_DISTRIBUTION,
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
