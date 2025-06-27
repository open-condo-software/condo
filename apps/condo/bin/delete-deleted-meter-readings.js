const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')
const get = require('lodash/get')

const { find } = require('@open-condo/keystone/schema')

const { MeterReading } = require('@condo/domains/meter/utils/serverSchema')

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

    async findBrokenMeterReadings () {
        this.brokenMeterReadings = await find('MeterReading', {
            meter_is_null: true,
        })
    }

    async fixBrokenMeterReadings () {
        if (!get(this.brokenMeterReadings, 'length')) return

        for (const meterReading of this.brokenMeterReadings) {
            await MeterReading.update(this.context, meterReading.id, {
                deletedAt: new Date().toDateString(),
                dv: 1,
                sender: { dv: 1, fingerprint: 'delete-deleted-meter-readings' },
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