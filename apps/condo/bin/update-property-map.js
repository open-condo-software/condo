const path = require('path')
const { Client } = require('pg')
const {
    Property,
} = require('@condo/domains/property/utils/serverSchema')
const { normalizePropertyMap } = require('@condo/domains/property/utils/serverSchema/helpers')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { has } = require('lodash')


class PropertyMapUpdater {
    processedCount = 0

    async init () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
        this.pg = new Client(process.env.DATABASE_URL)
        this.pg.connect()

        const { rows } = await this.pg.query(' SELECT id, map, "unitsCount" FROM "Property" WHERE "map" IS NOT NULL AND "deletedAt" IS NULL')
        this.properties = rows
    }

    async fix () {
        for (const property of this.properties) {
            if (property.map) {
                property.map = normalizePropertyMap(property.map)
            }

            const needToFixSections = property.map.sections.map(section => section.floors.map(floor => floor.units.map(unit => unit.unitType))).flat(2).some(unitType => unitType === undefined)
            if (needToFixSections) {
                const repairedMap = this.fixChessboard(property.map)
                await Property.update(this.context.createContext({ skipAccessControl: true }), property.id, {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'map-fixer' },
                    map: repairedMap,
                })
                this.processedCount++
            }
        }
    }

    fixChessboard (map) {
        if (!has(map, 'parking')) {
            map.parking = []
        }
        map.sections.forEach(section => {
            section.floors.forEach(floor => {
                floor.units.forEach(unit => {
                    if (!has(unit, 'unitType')) {
                        unit.unitType = 'flat'
                    }
                })
            })
        })
        return map
    }
}

const updateMapStructure = async () => {
    const fixer = new PropertyMapUpdater()
    await fixer.init()
    await fixer.fix()

    console.log(`Total processed rows = ${fixer.processedCount}`)
}

updateMapStructure().then(() => {
    process.exit(0)
}).catch(err => {
    console.error('Error: ', err)
})
