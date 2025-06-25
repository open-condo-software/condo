const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')
const { isEmpty } = require('lodash')

const { find } = require('@open-condo/keystone/schema')

const { Meter } = require('@condo/domains/meter/utils/serverSchema')


const { prompt } = require('./lib/prompt')

class DeleteMeters {
    constructor (propertyIds) {
        this.propertyIds = propertyIds
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

    async findMeters () {
        return await find('Meter', {
            deletedAt: null,
            property: {
                id_in: this.propertyIds,
            },
        })
    }

    async deleteMeters () {
        const meters = await this.findMeters()
        if (isEmpty(meters)) {
            console.info('[INFO] Could not found meters by specified property ids')
            return
        }

        console.info(`[INFO] Following meters will be deleted: [${meters.map(reading => `'${reading.id}'`).join(', ')}]`)
        const answer = await prompt('Continue? (Y/N)')

        if (answer === 'Y') {
            for (const meter of meters) {
                console.info(`Deleting Meter (id = "${meter.id}")`)
                await Meter.softDelete(this.context, meter.id, 'id', {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'delete-meters-by-property-ids' },
                })
            }
            console.info('[INFO] Deleted all Meter records with associated MeterReading')
        }
    }
}

const deleteMetersScript = async (propertyIds) => {
    if (isEmpty(propertyIds)) {
        throw new Error('propertyIds not found!')
    }
    const deleter = new DeleteMeters(propertyIds)
    console.info('[INFO] Connecting to database...')
    await deleter.connect()
    await deleter.deleteMeters()
}

const propertyIds = process.argv.slice(2) // .slice(2) because first two arguments are nodePath and appPath

deleteMetersScript(propertyIds).then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
})
