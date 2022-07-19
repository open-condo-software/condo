const path = require('path')
const { find } = require('@core/keystone/schema')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const get = require('lodash/get')
const { MeterReading } = require('@condo/domains/meter/utils/serverSchema')
const { RESIDENT } = require('@condo/domains/user/constants/common')

class FixMeterReadingsClients {
    context = null
    brokenMeterReadings = []

    async connect () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async findMeterReadings () {
        this.meterReadings = await find('MeterReading', {
            meter: { property: { id_in: ["3377a303-b098-426a-b559-e0acdf57071e", "19e7b8f0-d204-4f1e-80df-6069f01b15b4"] } }
        })
    }

    async fixBrokenMeterReadings () {
        if (!get(this.meterReadings, 'length')) return

        for (const meterReading of this.meterReadings) {
            await MeterReading.update(this.context, meterReading.id, {
                deletedAt: new Date().toDateString(),
                dv: 1,
                sender: { dv: 1, fingerprint: 'deleteIncorrectMeterReadingsScript' },
            })
        }
    }
}

const fixMeterReadings = async () => {
    const fixer = new FixMeterReadingsClients()
    console.info('[INFO] Connecting to database...')
    await fixer.connect()
    console.info('[INFO] Finding broken meter readings...')
    await fixer.findBrokenMeterReadings()
    console.info(`[INFO] Following meter readings will be fixed: [${fixer.brokenMeterReadings.map(reading => `"${reading.id}"`).join(', ')}]`)
    await fixer.fixBrokenMeterReadings()
    console.info('[INFO] Broken meter readings are fixed...')
}

fixMeterReadings().then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
})