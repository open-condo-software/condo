const path = require('path')
const { find } = require('@core/keystone/schema')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const get = require('lodash/get')
const { MeterReading, Meter } = require('@condo/domains/meter/utils/serverSchema')

class FixMeterReadingsClients {
    constructor (propertyIds) {
        this.propertyIds = propertyIds
        this.context = null
        this.meters = []
        this.meterReadings = []
    }

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
            meter: { property: { id_in: this.propertyIds } },
        })
    }

    async findMeters () {
        this.meters = await find('Meter', {
            property: { id_in: this.propertyIds },
        })
    }

    async deleteBrokenMeterReadings () {
        if (!get(this.meterReadings, 'length')) return

        for (const meterReading of this.meterReadings) {
            await MeterReading.update(this.context, meterReading.id, {
                deletedAt: 'true',
                dv: 1,
                sender: { dv: 1, fingerprint: 'deleteIncorrectMeterReadingsScript' },
            })
        }
    }

    async deleteBrokenMeters () {
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

const deleteMeterReadings = async (propertyIds) => {
    if (!propertyIds) {
        throw new Error("propertyIds not found!")
    }
    const fixer = new FixMeterReadingsClients(propertyIds)
    console.info('[INFO] Connecting to database...')
    await fixer.connect()
    console.info('[INFO] Finding broken meter readings and meters...')
    await fixer.findMeterReadings()
    console.info(`[INFO] Following meter readings will be deleted: [${fixer.meterReadings.map(reading => `'${reading.id}'`).join(', ')}]`)
    await fixer.findMeters()
    console.info(`[INFO] Following meters will be deleted: [${fixer.meters.map(reading => `'${reading.id}'`).join(', ')}]`)
    await fixer.fixBrokenMeterReadings()
    console.info('[INFO] Broken meter readings are deleted...')
    await fixer.fixBrokenMeters()
    console.info('[INFO] Broken meters are deleted...')
}

const propertyIds = process.argv.slice(2) // .slice(2) because first two arguments are nodePath and appPath

deleteMeterReadings(propertyIds).then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
})
