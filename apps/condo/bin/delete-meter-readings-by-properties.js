const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')
const dayjs = require('dayjs')
const { isEmpty, get } = require('lodash')
const { hideBin } = require('yargs/helpers')
const yargs = require('yargs/yargs')

const { find } = require('@open-condo/keystone/schema')

const { MeterReading } = require('@condo/domains/meter/utils/serverSchema')

const { prompt } = require('./lib/prompt')

/**
 * Soft deletes meter readings by property ids and date
 *
 * Usage:
 * node delete-meter-readings-by-properties.js --date=2024-12-01 propertyId1 propertyId2 propertyId3 ...
 *
 * NOTE: Date must be in yyyy-mm-dd format
 */


class MeterReadingsCleaner {
    constructor ({ propertyIds, date }) {
        this.propertyIds = propertyIds
        this.date = date
        this.context = null
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
        return await find('MeterReading', {
            deletedAt: null,
            date: dayjs(this.date).toISOString(),
            meter: {
                property: {
                    id_in: this.propertyIds,
                },
                deletedAt: null,
            },
        })
    }

    async deleteMeterReadings () {
        const meterReadings = await this.findMeterReadings()

        if (isEmpty(meterReadings)) {
            return console.info('[INFO] Could not found meterReadings by specified property ids')
        }

        console.info(`[INFO] Following meterReadings will be deleted: [${meterReadings.map(reading => `'${reading.id}'`).join(', ')}]`)
        const answer = await prompt('Continue? (Y/N)')

        if (answer === 'Y') {
            for (const reading of meterReadings) {
                console.info(`Deleting meter reading (id = "${reading.id}")`)
                await MeterReading.softDelete(this.context, reading.id, {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'delete-meter-readings-by-property-ids' },
                })
            }
            console.info('[INFO] Successfully deleted meter readings')
        }
    }
}

const deleteMeterReadingsScript = async ({ propertyIds, date }) => {
    if (isEmpty(propertyIds)) {
        return console.error('propertyIds not found!')
    }
    if (isEmpty(date)) {
        return console.error('date not found! Enter date in --date=yyyy-mm-dd format')
    }
    const deleter = new MeterReadingsCleaner({ propertyIds, date })
    console.info('[INFO] Connecting to database...')
    await deleter.connect()
    await deleter.deleteMeterReadings()
}

const argv = yargs(hideBin(process.argv)).argv

const date = get(argv, 'date')
const propertyIds = get(argv, '_')


deleteMeterReadingsScript({ propertyIds, date }).then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
})
