/**
 * Detects non-deleted Resident items with organization === null and searches for matching address within Property items
 *
 * Usage:
 *      yarn workspace @app/condo node ./bin/resident/detect-orphan-residents-addresses.js [SKIP] [LIMIT]
 */

const { isEmpty, get } = require('lodash')
const pino = require('pino')
const falsey = require('falsey')
const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')
const { getSchemaCtx } = require('@core/keystone/schema')

const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')

const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')

const logger = pino({
    name: 'send_billing_receipt_added_notifications',
    enabled: falsey(process.env.DISABLE_LOGGING),
})

const CHUNK_SIZE = 10
const FIELDS_TO_MATCH = ['region', 'area', 'city', 'settlement', 'street']

const getStringCharsCount = s => {
    const l = s.length
    const sl = s.toLocaleLowerCase(['ru-RU', 'en-EN'])
    const charsCount = {}

    for (let i = 0; i < l; i++) {
        const char = sl.substring(i, i + 1)

        if (!charsCount[char]) charsCount[char] = 0

        charsCount[char] += 1
    }

    return charsCount
}

const getABDiff = (charsCountA, charsCountB) => {
    let diff = 0

    Object.entries(charsCountA).forEach(([char, count]) => {
        diff += Math.abs(count - (charsCountB[char] || 0))
    })

    return diff
}

const getStringsDiff = (a, b) => {
    const charsCountA = getStringCharsCount(a)
    const charsCountB = getStringCharsCount(b)

    return getABDiff(charsCountA, charsCountB) + getABDiff(charsCountB, charsCountA)
}

const logProperty = async (context, bestMatchedProperty, resident, propertiesCount) => {
    if (bestMatchedProperty) {
        const organization = await Organization.getOne(context, { id: bestMatchedProperty.organization.id })

        console.log([
            resident.user.id,
            resident.id,
            bestMatchedProperty.id,
            organization.id,
            organization.name,
            organization.tin,
            resident.user.name,
            resident.address,
            bestMatchedProperty.address,
            propertiesCount,
        ].join('|'))
    }

}

async function detectOrphanResidents (where = {}, initialSkip, limit = '100') {
    const { keystone: context } = await getSchemaCtx('Resident')
    const residentsWhere = {
        ...where,
        // property_is_null: true,
    }
    const residentsCount = await Resident.count(context, residentsWhere)
    const maxRows = initialSkip ? parseInt(initialSkip) + parseInt(limit) : residentsCount
    const first = parseInt(limit) < CHUNK_SIZE ? parseInt(limit) : CHUNK_SIZE
    let skip = parseInt(initialSkip) || 0

    logger.info({ message: 'Orphan residents found:', residentsCount, residentsWhere, skip, limit, maxRows })

    if (!residentsCount) return

    while (skip < maxRows) {
        const residents = await Resident.getAll(context, residentsWhere, { sortBy: ['createdAt_ASC'], first, skip })

        if (isEmpty(residents)) break

        skip += residents.length

        for (const resident of residents) {
            const propertyWhereConditions = []

            if (resident.addressMeta.data.area) propertyWhereConditions.push({ address_contains_i: resident.addressMeta.data.area })
            if (resident.addressMeta.data.city) propertyWhereConditions.push({ address_contains_i: resident.addressMeta.data.city })
            if (resident.addressMeta.data.settlement) propertyWhereConditions.push({ address_contains_i: resident.addressMeta.data.settlement })

            const propertyWhere = {
                AND: [
                    { address_contains_i: resident.addressMeta.data.street },
                    { OR: propertyWhereConditions },
                ],
            }
            const properties = await loadListByChunks({ context, list: Property, where: propertyWhere })
            let prevBestMatchedProperty = null
            let bestMatchedProperty = null
            let maxFieldsMatched = 0

            for (const property of properties) {
                const propFieldsMatched = FIELDS_TO_MATCH.filter(field => {
                    const propertyField = get(property.addressMeta.data, field)
                    const residentField = get(resident.addressMeta.data, field)

                    // Field is not present in both compared sets
                    if (!propertyField || !residentField) return false

                    const lProperty = propertyField.length
                    const lResident = residentField.length

                    // lengths of values differ too much
                    if (Math.abs(lProperty - lResident) >= (lProperty + lResident) / 4) return false

                    // both values have more than 20% difference in chars
                    if (getStringsDiff(residentField, propertyField) > (lProperty + lResident) / 2 * 0.2) return false

                    return true
                })
                    .length

                if (propFieldsMatched > maxFieldsMatched) {
                    maxFieldsMatched = propFieldsMatched
                    prevBestMatchedProperty = bestMatchedProperty
                    bestMatchedProperty = property
                }
            }

            if (bestMatchedProperty) await logProperty(context, bestMatchedProperty, resident, properties.length)
            if (prevBestMatchedProperty) await logProperty(context, prevBestMatchedProperty, resident, properties.length)

            // break
        }

        // break
    }
}


async function connectKeystone () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    return keystone
}

async function main () {
    const keystone = await connectKeystone()
    const skip = process.argv[2]
    const limit = process.argv[3]

    await detectOrphanResidents({}, skip, limit)

    keystone.disconnect()
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })

module.exports = {
    detectOrphanResidents,
    getStringsDiff,
}