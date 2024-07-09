const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')

const { Property } = require('@condo/domains/property/utils/serverSchema')


const DV = 1
const SENDER = { dv: DV, fingerprint: 'update-address-key' }

class PropertyUpdater {
    async connect () {
        console.info('[INFO] Connecting to database...')
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async updateAddressKeys () {
        const where = {
            sender: {
                dv: 1,
                fingerprint: 'update-address-key',
            },
            map_not: null,
            deletedAt: null,
            unitsCount: 0,
            uninhabitedUnitsCount: 0,
        }

        const count = await Property.count(this.context, where)

        console.log(`Total count before update => ${count}`)

        for (const i of Array.from({ length: 5 }, (_, i) => i + 1)) {
            console.log(`------------- Start iteration ${i} --------------`)
            const properties = await Property.getAll(this.context, where)
            console.log(`Properties found => ${properties.length}`)
            let innerCount = 0
            for (const property of properties) {
                console.log(`try to update ${property.id} - unitsCount = ${property.unitsCount}, uninhabitedUnitsCount = ${property.uninhabitedUnitsCount}`)
                try {
                    const updatedProperty = await Property.update(this.context, property.id, { dv: 1, sender: SENDER, map: property.map })
                    innerCount++
                    console.log(`${innerCount} property updated - ${updatedProperty.id} / ${updatedProperty.address}. - unitsCount = ${updatedProperty.unitsCount}, uninhabitedUnitsCount = ${updatedProperty.uninhabitedUnitsCount}`)
                } catch (e) {
                    console.log(`CANT UPDATE PROPERTY ${e}`)
                }
            }
            console.log(`------------- End of iteration ${i} --------------`)

        }

        const countAfterUpdate = await Property.count(this.context, where)
        console.log(`Total count after update => ${countAfterUpdate} / ${count}`)
    }
}

const updateProperties = async () => {
    const propertyUpdater = new PropertyUpdater()
    console.time('keystone')
    await propertyUpdater.connect()
    console.timeEnd('keystone')
    await propertyUpdater.updateAddressKeys()
}

updateProperties().then(() => {
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
})
