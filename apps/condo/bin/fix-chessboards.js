const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')
const Ajv = require('ajv')
const { has, get, isEmpty, compact, trim } = require('lodash')
const { Client } = require('pg')

const MapSchemaJSON = require('@condo/domains/property/components/panels/Builder/MapJsonSchema.json')
const {
    Property,
} = require('@condo/domains/property/utils/serverSchema')
const { normalizePropertyMap } = require('@condo/domains/property/utils/serverSchema/helpers.js')
// const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')

const mapValidator = (new Ajv()).compile(MapSchemaJSON)

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
            if (property.map) {
                property.map = normalizePropertyMap(property.map)
            }
        })
    }

    async check () {
        this.properties.forEach(property => {
            if (property.map) {
                if (typeof property.map !== 'object') {
                    // console.log('property with strange map', property.id, property.map)
                } else {
                    // const units = this.countUnits(property.map)
                    if (!mapValidator(property.map)){ // ||  units !== property.unitsCount
                        console.log('~Errors: ', property.id, mapValidator.errors)
                        this.toFix.push(property)
                    }
                }
            }
        })
    }

    async fix () {
        for (const property of this.toFix) {
            const repairedMap = this.fixChessboard(property.map)
            await Property.update(this.context.createContext({ skipAccessControl: true }), property.id, {
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

    countUnits (map) {
        return get(map, 'sections', [])
            .map((section) => get(section, 'floors', [])
                .map(floor => get(floor, 'units', []).length))
            .flat()
            .reduce((total, unitsOnFloor) => total + unitsOnFloor, 0)
    }

}

// Some times need to start this script several times
// Need to fix: 787 / 1917
const fixMaps = async () => {
    const fixer = new FixPropertyMaps()
    await fixer.init()
    await fixer.check()
    await fixer.fix()
    console.log(`Check: ${fixer.toFix.length} / ${fixer.properties.length}`)
}

const importProperties = async () => {
    // Better to use sql dump - but this will work with csv
    const fs = require('fs')
    // set your data here
    const ORGANIZATION_ID = 'fdd26d23-7782-4bad-b6b8-812e5d4baf76'
    const file = fs.readFileSync(`${__dirname}/houses.csv`).toString()

    const strings = compact(file.split(/[\r\n]/g))
    const pg = new Client(process.env.DATABASE_URL)
    pg.connect()
    let header = []
    const data = []
    const tryToJson = (text) => {
        text = trim(text.split('""').join('"'), '"')
        try {
            const objs = JSON.parse(text)
            return objs
        } catch (err) {
            return text
        }
    }
    strings.forEach( (str, idx) => {
        const row = str.split(/(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g)
        if (!idx) {
            header = row
        } else {
            data.push(Object.fromEntries(row.map( (r, i) => ([header[i], tryToJson(r)]))))
        }
    })
    for (const property of data) {
        if (typeof property.map === 'object' ) {
            await pg.query('INSERT INTO "Property" (dv, v, type, sender, id, organization, address, "addressMeta", map, "unitsCount") VALUES (1, 1, \'building\', $1, $2, $3, $4, $5, $6, $7) ', [
                { dv: 1, fingerprint: 'import-property' },
                property.id,
                ORGANIZATION_ID,
                property.address,
                property.addressMeta,
                property.map,
                property.unitsCount || 0,
            ])
        }
    }

}

// Turn on if you need to import properties
//importProperties().then(() => {
//    process.exit(0)
//}).catch(err => {
//    console.error('Error: ', err)
//})

// Turn on if you need to fix

fixMaps().then(() => {
    process.exit(0)
}).catch(err => {
    console.error('Error: ', err)
})
