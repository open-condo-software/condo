const path = require('path')
const { get, isEmpty } = require('lodash')
const { Client } = require('pg')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { Property } = require('@condo/domains/property/utils/serverSchema')


class UpdatePropertyMap {
    async init () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()

        this.context = await keystone.createContext({ skipAccessControl: true })
        this.pg = new Client(process.env.DATABASE_URL)
        this.pg.connect()

        const { rows } = await this.pg.query('SELECT id, map FROM "Property" WHERE "map" IS NOT NULL AND "deletedAt" IS NULL')
        this.properties = rows

        console.log('total properties = ', this.properties.length)
    }

    async fix () {
        for (const property of this.properties) {
            const hasSections = !isEmpty(get(property.map, 'sections'))
            if (hasSections) {
                const newPropertyMap = this.addNewPropertyEntities(property.map)
                await Property.update(this.context.createContext({ skipAccessControl: true }), property.id, {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'update-property-entities' },
                    map: newPropertyMap,
                })
            }
        }
    }

    addNewPropertyEntities (propertyMap) {
        propertyMap.sections.forEach((section, sectionIndex) => {
            section.roof = {
                index: sectionIndex,
                type: 'roof',
                label: section.name,
            }

            section.attic = [{
                index: sectionIndex,
                type: 'attic',
                label: section.name,
            }]

            section.basement = [{
                index: sectionIndex,
                type: 'basement',
                label: section.name,
            }]
        })
        return propertyMap
    }
}

const updatePropertyMapStructure = async () => {
    const updatePropertyMap = new UpdatePropertyMap()
    await updatePropertyMap.init()
    await updatePropertyMap.fix()
    console.log('done')
}

updatePropertyMapStructure().then(() => {
    process.exit(0)
}).catch(error => {
    console.error('Error: ', error)
})
