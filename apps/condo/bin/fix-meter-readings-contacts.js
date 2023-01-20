const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')
const get = require('lodash/get')

const { find } = require('@open-condo/keystone/schema')

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

    async findBrokenMeterReadings () {
        this.brokenMeterReadings = await find('MeterReading', {
            client_is_null: true,
            clientName: null,
            clientPhone: null,
            createdBy: { type: RESIDENT },
        })
    }

    async fixBrokenMeterReadings () {
        if (!get(this.brokenMeterReadings, 'length')) return
        const users = await find('User', {
            id_in: this.brokenMeterReadings.map(reading => reading.createdBy),
            type: RESIDENT,
        })
        const usersByIds = Object.assign({}, ...users.map(user => ({ [user.id]: user })))

        for (const meterReading of this.brokenMeterReadings) {
            const user = get(usersByIds, meterReading.createdBy)
            const userId = get(user, 'id')

            await MeterReading.update(this.context, meterReading.id, {
                client: { connect: { id: userId } },
                clientName: get(user, 'name'),
                clientPhone: get(user, 'phone'),
                dv: 1,
                sender: { dv: 1, fingerprint: 'fixTicketScript' },
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