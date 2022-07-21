const path = require('path')
const { find } = require('@core/keystone/schema')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { Meter } = require('@condo/domains/meter/utils/serverSchema')
const { isEmpty } = require('lodash')

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

        console.info(`[INFO] Following meters will be deleted: [${meters.map(reading => `'${reading.id}'`).join(', ')}]`)

        if (isEmpty(meters)) return

        for (const meter of meters) {
            await Meter.softDelete(this.context, meter.id, {
                dv: 1,
                sender: { dv: 1, fingerprint: 'deleteIncorrectMetersScript' },
            })
        }

        console.info('[INFO] Meters are deleted...')
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
