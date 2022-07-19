const path = require('path')
const { find } = require('@core/keystone/schema')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const get = require('lodash/get')
const { MeterReading, Meter } = require('@condo/domains/meter/utils/serverSchema')
const { RESIDENT } = require('@condo/domains/user/constants/common')

class FixMeterReadingsClients {
    context = null
    meters = []
    meterReadings = []

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

    async findMeters () {
        this.meters = await find('Meter', {
            property: { id_in: ["3377a303-b098-426a-b559-e0acdf57071e", "19e7b8f0-d204-4f1e-80df-6069f01b15b4"] }
        })
    }

    async fixBrokenMeterReadings () {
        if (!get(this.meterReadings, 'length')) return

        for (const meterReading of this.meterReadings) {
            await MeterReading.update(this.context, meterReading.id, {
                deletedAt: 'true',
                dv: 1,
                sender: { dv: 1, fingerprint: 'deleteIncorrectMeterReadingsScript' },
            })
        }
    }

    async fixBrokenMeters () {
        if (!get(this.meters, 'length')) return

        for (const meter of this.meters) {
            await Meter.update(this.context, meter.id, {
                deletedAt: 'true',
                dv: 1,
                sender: { dv: 1, fingerprint: 'deleteIncorrectMetersScript' },
            })
        }
    }
}

const deleteMeterReadings = async () => {
    const fixer = new FixMeterReadingsClients()
    console.info('[INFO] Connecting to database...')
    await fixer.connect()
    console.info('[INFO] Finding broken meter readings and meters...')
    await fixer.findMeterReadings()
    console.info(`[INFO] Following meter readings will be deleted: [${fixer.meterReadings.map(reading => `"${reading.id}"`).join(', ')}]`)
    await fixer.findMeters()
    console.info(`[INFO] Following meters will be deleted: [${fixer.meters.map(reading => `"${reading.id}"`).join(', ')}]`)
    await fixer.fixBrokenMeterReadings()
    console.info('[INFO] Broken meter readings are deleted...')
    await fixer.fixBrokenMeters()
    console.info('[INFO] Broken meters are deleted...')
}

deleteMeterReadings().then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
})
