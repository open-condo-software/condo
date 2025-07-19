const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')
const dayjs = require('dayjs')
const { isEmpty, get } = require('lodash')
const { hideBin } = require('yargs/helpers')
const yargs = require('yargs/yargs')

const { find } = require('@open-condo/keystone/schema')

const { MeterReading } = require('@condo/domains/meter/utils/serverSchema')

const { prompt } = require('./lib/prompt')

/**
 * Soft deletes imported meter readings by property ids and createdAt interval
 *
 * Usage:
 * node delete-meter-readings-by-properties.js --start="2024-12-01 12:10" --end="2024-12-01 12:20" propertyId1 propertyId2 propertyId3 ...
 *
 * NOTE: Date must be in "yyyy-mm-dd hh:mm" format
 */


class MeterReadingsCleaner {
    constructor ({ propertyIds, startDateTime, endDateTime }) {
        this.propertyIds = propertyIds
        this.startDateTime = startDateTime
        this.endDateTime = endDateTime
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
            createdAt_gte: dayjs(this.startDateTime).toISOString(),
            createdAt_lte: dayjs(this.endDateTime).toISOString(),
            meter: {
                property: {
                    id_in: this.propertyIds,
                },
                deletedAt: null,
            },
            source: {
                type: 'import_condo',
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
                await MeterReading.softDelete(this.context, reading.id, 'id', {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'delete-meter-readings-by-property-ids' },
                })
            }
            console.info('[INFO] Successfully deleted meter readings')
        }
    }
}

const deleteMeterReadingsScript = async ({ propertyIds, startDateTime, endDateTime }) => {
    if (isEmpty(propertyIds)) {
        return console.error('propertyIds not specified!')
    }
    if (isEmpty(startDateTime) || isEmpty(endDateTime) ) {
        return console.error('start createdAt datetime or end createdAt datetime are not specified! Use params --start="..." --end="..." in "yyyy-mm-dd hh:mm" format')
    }
    const deleter = new MeterReadingsCleaner({ propertyIds, startDateTime, endDateTime })
    console.info('[INFO] Connecting to database...')
    await deleter.connect()
    await deleter.deleteMeterReadings()
}

const argv = yargs(hideBin(process.argv)).argv

const startDateTime = get(argv, 'start')
const endDateTime = get(argv, 'end')
const propertyIds = get(argv, '_')


deleteMeterReadingsScript({ propertyIds, startDateTime, endDateTime }).then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
})
