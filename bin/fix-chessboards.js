const {
    Property,
} = require('@condo/domains/property/utils/serverSchema')
const { normalizePropertyMap } = require('@condo/domains/property/utils/serverSchema/helpers.js')
const path = require('path')
const { GraphQLApp } = require('@keystonejs/app-graphql')
// const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const MapSchemaJSON = require('@condo/domains/property/components/panels/Builder/MapJsonSchema.json')
const Ajv = require('ajv')
const mapValidator = (new Ajv()).compile(MapSchemaJSON)
const { has, get } = require('lodash')
const { Client } = require('pg')

class FixPropertyMaps {

    async init () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        // we need only apollo
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
        this.pg = new Client(process.env.DATABASE_URL)
        this.pg.connect()
        this.toFix = []
        /* Not working, we need direct sql query here
        this.properties = await loadListByChunks({
            context: this.context,
            list: Property,
        })
        */
        const { rows } = await this.pg.query(' SELECT id, map, "unitsCount" FROM "Property" WHERE 1=1 ')
        this.properties = rows
        this.properties.forEach(property => {
            property.map = normalizePropertyMap(property.map)
        })
    }

    async check () {
        this.properties.forEach(property => {
            const units = this.countUnits(property.map)
            if (!mapValidator(property.map) ||  units !== property.unitsCount){
                console.log('~Errors: ', mapValidator.errors, `${property.unitsCount} == ${units}`)
                this.toFix.push(property)
            }
        })
    }

    async fix () {
        for (const property of this.toFix) {
            const repairedMap = this.fixChessboard(property.map)
            await Property.update(this.context, property.id, {
                dv: 1,
                sender: { dv: 1, fingerprint: 'map-fixer' },
                map: repairedMap,
            })
        }
    }


    fixChessboard (map) {
        let autoincrement = 0
        if (!has(map, 'dv')) {
            map.dv = 1
        }
        if (!has(map, 'type')) {
            map.type = 'building'
        }
        map.sections.forEach((section, sectionIndex) => {
            section.type = 'section'
            section.id = String(++autoincrement)
            section.index = sectionIndex
            if (!has(section, 'name')) {
                section.name = String(section.index)
            }
            section.floors.forEach((floor, floorIndex) => {
                floor.type = 'floor'
                floor.id = String(++autoincrement)
                if (!has(floor, 'index')) {
                    floor.index = floorIndex
                }
                if (!has(floor, 'name')) {
                    floor.name = String(floorIndex)
                }
                floor.units.forEach(unit => {
                    unit.type = 'unit'
                    unit.id = String(++autoincrement)
                    if (!has(unit, 'label')) {
                        unit.label = has(unit, 'name') ? unit.name : ''
                    }
                })
            })
        })
        return map
    }

    countUnits = (map) => {
        return get(map, 'sections', [])
            .map((section) => get(section, 'floors', [])
                .map(floor => get(floor, 'units', []).length))
            .flat()
            .reduce((total, unitsOnFloor) => total + unitsOnFloor, 0)
    }

}

const fixMaps = async () => {
    const fixer = new FixPropertyMaps()
    await fixer.init()
    await fixer.check()
    console.log(`Need to fix: ${fixer.toFix.length} / ${fixer.properties.length}`)
    await fixer.fix()
}


fixMaps().then(() => {
    process.exit(0)
}).catch(err => {
    console.error('Error: ', err)
})
