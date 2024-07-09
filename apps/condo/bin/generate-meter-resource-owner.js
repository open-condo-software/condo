const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')

const {
    MeterResourceOwner,
} = require('@condo/domains/meter/utils/serverSchema')


const DV = 1
const SENDER = { dv: DV, fingerprint: 'generate-resource-owner' }

class GenerateMeterResourceOwner {
    async connect () {
        console.info('[INFO] Connecting to database...')
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()

        this.context = await keystone.createContext({ skipAccessControl: true })
        this.knex = keystone.adapter.knex
    }

    async generateMeterResourceOwners () {
        // SELECT distinct "Meter"."organization", "Property"."address", "Meter"."resource"
        // FROM "Meter"
        // LEFT JOIN "Property" AS "Property" ON "Meter"."property" = "Property"."id"

        // await this.knex('MeterResourceOwner').delete().where({ 'deletedAt': null })
        //
        // const count = await this.knex('MeterResourceOwner').select('id')
        //
        // console.log(count.length)
        const totalCount = await this.knex('Meter')
            .select(this.knex.raw('distinct "Meter"."organization", "Property"."address", "Property"."addressSources", "Meter"."resource"'))
            .leftJoin('Property', 'Property.id', 'Meter.property')
            .leftJoin('Organization', 'Organization.id', 'Meter.organization')
            .whereRaw('"Organization"."deletedAt" IS NULL AND "Organization"."isApproved" IS FALSE AND "Meter"."deletedAt" IS NULL AND "Property"."deletedAt" IS NULL')

        console.log('totalCount = ', totalCount.length)

        const result = await this.knex('Meter')
            .select(this.knex.raw('distinct "Meter"."organization", "Property"."address", "Property"."addressSources", "Meter"."resource"'))
            .leftJoin('Property', 'Property.id', 'Meter.property')
            .leftJoin('Organization', 'Organization.id', 'Meter.organization')
            .whereRaw('"Organization"."deletedAt" IS NULL AND "Organization"."isApproved" IS FALSE AND "Meter"."deletedAt" IS NULL AND "Property"."deletedAt" IS NULL')
            .limit(500).offset(0)

        // console.log(result)
        console.log(result.length)

        let createdCount = 0

        for (const data of result) {
            // console.log(data)
            try {
                const meterResourceOwnerData = {
                    dv: DV, sender: SENDER,
                    organization: { connect: { id: data.organization } },
                    resource: { connect: { id: data.resource } },
                    address: data.address,
                }

                if (data.addressSources !== null && data.addressSources.length > 0 && data.addressSources[0].includes('injectionId')) {
                    // console.log('use injectionId instead of address string')
                    meterResourceOwnerData.address = data.addressSources[0]
                }

                await MeterResourceOwner.create(this.context, meterResourceOwnerData)
                // console.log('created ', res)
                createdCount++
                // console.log('created = ', createdCount)
            } catch (e) {
                console.log(e)
                console.log(JSON.stringify(e))
            }
        }
        console.log('total created = ', createdCount)
        console.log('total count = ', totalCount.length)
    }
}

const generateMeterResourceOwners = async () => {
    const meterResourceGenerator = new GenerateMeterResourceOwner()
    await meterResourceGenerator.connect()
    await meterResourceGenerator.generateMeterResourceOwners()
}

generateMeterResourceOwners().then(() => {
    console.log('All done')
    process.exit(0)
}).catch(error => {
    console.error('Failed to generate MeterResourceOwners ', error)
})

