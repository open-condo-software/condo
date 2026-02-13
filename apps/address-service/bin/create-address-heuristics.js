/**
 * Create AddressHeuristic records from existing Address data.
 *
 * For each Address:
 *   1. Parse Address.key → create primary heuristic record
 *   2. Extract additional heuristics from Address.meta.data
 *
 * Usage:
 *      yarn workspace @app/address-service node bin/create-address-heuristics.js [--dry-run]
 */

const path = require('path')

const get = require('lodash/get')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')
const { find } = require('@open-condo/keystone/schema')

const { AddressHeuristic, Address } = require('@address-service/domains/address/utils/serverSchema')
const {
    HEURISTIC_TYPE_FIAS_ID,
    HEURISTIC_TYPE_COORDINATES,
    HEURISTIC_TYPE_GOOGLE_PLACE_ID,
    HEURISTIC_TYPE_FALLBACK,
} = require('@address-service/domains/common/constants/heuristicTypes')
const { parseCoordinates, findCoordinateHeuristicsInRange, findRootAddress } = require('@address-service/domains/common/utils/services/search/heuristicMatcher')

const dv = 1
const sender = { dv, fingerprint: 'create-address-heuristics' }
const dvSender = { dv, sender }

/**
 * Parse Address.key to determine primary heuristic type and value
 */
function parseAddressKey (key) {
    if (key.startsWith('fias_id:')) {
        return { type: HEURISTIC_TYPE_FIAS_ID, value: key.slice('fias_id:'.length), reliability: 95 }
    }
    if (key.startsWith('fallback:')) {
        return { type: HEURISTIC_TYPE_FALLBACK, value: key.slice('fallback:'.length), reliability: 10 }
    }
    if (key.startsWith('coordinates:')) {
        return { type: HEURISTIC_TYPE_COORDINATES, value: key.slice('coordinates:'.length), reliability: 70 }
    }
    if (key.startsWith('google_place_id:')) {
        return { type: HEURISTIC_TYPE_GOOGLE_PLACE_ID, value: key.slice('google_place_id:'.length), reliability: 95 }
    }
    // Unmigrated key — treat as fallback
    return { type: HEURISTIC_TYPE_FALLBACK, value: key, reliability: 10 }
}

/**
 * Extract additional heuristics from Address.meta.data
 */
function extractAdditionalHeuristics (meta, primaryType) {
    const heuristics = []
    const data = get(meta, 'data', {})

    // Coordinates
    const geoLat = get(data, 'geo_lat')
    const geoLon = get(data, 'geo_lon')
    if (geoLat && geoLon && primaryType !== HEURISTIC_TYPE_COORDINATES) {
        const qcGeo = get(data, 'qc_geo')
        const reliabilityByQcGeo = { '0': 90, '1': 80, '2': 50, '3': 30, '4': 20 }
        heuristics.push({
            type: HEURISTIC_TYPE_COORDINATES,
            value: `${geoLat},${geoLon}`,
            reliability: reliabilityByQcGeo[String(qcGeo)] || 70,
            meta: qcGeo != null ? { qc_geo: qcGeo } : null,
        })
    }

    // Google Place ID
    const placeId = get(meta, ['provider', 'rawData', 'place_id'])
    if (placeId && primaryType !== HEURISTIC_TYPE_GOOGLE_PLACE_ID) {
        heuristics.push({
            type: HEURISTIC_TYPE_GOOGLE_PLACE_ID,
            value: placeId,
            reliability: 95,
            meta: null,
        })
    }

    return heuristics
}

/**
 * Check if a heuristic already exists (exact for non-coordinates, fuzzy for coordinates)
 */
async function heuristicExists (type, value) {
    if (type === HEURISTIC_TYPE_COORDINATES) {
        const coords = parseCoordinates(value)
        if (!coords) return null
        const matches = await findCoordinateHeuristicsInRange(coords.latitude, coords.longitude)
        return matches.length > 0 ? matches[0] : null
    }

    const existing = await find('AddressHeuristic', {
        type,
        value,
        deletedAt: null,
    })
    return existing.length > 0 ? existing[0] : null
}

async function main (args) {
    const isDryRun = args.includes('--dry-run')
    if (isDryRun) {
        console.info('🔍 DRY RUN mode — no changes will be written')
    }

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })

    const pageSize = 100
    let offset = 0
    let totalProcessed = 0
    let totalCreated = 0
    let totalSkipped = 0
    let totalConflicts = 0

    let addresses
    do {
        addresses = await Address.getAll(context, { deletedAt: null }, {
            first: pageSize,
            skip: offset,
            sortBy: ['createdAt_ASC'],
        }, 'id key meta')

        for (const address of addresses) {
            totalProcessed++
            const providerName = get(address, ['meta', 'provider', 'name'], 'unknown')

            // Parse primary heuristic from key
            const primary = parseAddressKey(address.key)
            const additional = extractAdditionalHeuristics(address.meta, primary.type)
            const allHeuristics = [primary, ...additional]

            for (const heuristic of allHeuristics) {
                const existing = await heuristicExists(heuristic.type, heuristic.value)

                if (existing) {
                    if (existing.address === address.id) {
                        totalSkipped++
                        continue
                    }

                    // Conflict: heuristic points to a different address
                    totalConflicts++
                    if (isDryRun) {
                        console.info(`  [DRY RUN] CONFLICT ${address.id}: ${heuristic.type}:${heuristic.value} already belongs to ${existing.address}`)
                    } else {
                        console.info(`  CONFLICT ${address.id}: ${heuristic.type}:${heuristic.value} already belongs to ${existing.address}`)
                        const rootAddressId = await findRootAddress(existing.address)
                        await Address.update(context, address.id, {
                            ...dvSender,
                            possibleDuplicateOf: { connect: { id: rootAddressId } },
                        })
                    }
                    continue
                }

                // Create new heuristic
                if (isDryRun) {
                    console.info(`  [DRY RUN] CREATE ${address.id}: ${heuristic.type}:${heuristic.value} (reliability: ${heuristic.reliability}, provider: ${providerName})`)
                } else {
                    const createData = {
                        ...dvSender,
                        address: { connect: { id: address.id } },
                        type: heuristic.type,
                        value: heuristic.value,
                        reliability: heuristic.reliability,
                        provider: providerName,
                        meta: heuristic.meta || null,
                        enabled: true,
                    }

                    if (heuristic.type === HEURISTIC_TYPE_COORDINATES) {
                        const coords = parseCoordinates(heuristic.value)
                        if (coords) {
                            createData.latitude = String(coords.latitude)
                            createData.longitude = String(coords.longitude)
                        }
                    }

                    await AddressHeuristic.create(context, createData)
                    console.info(`  CREATE ${address.id}: ${heuristic.type}:${heuristic.value}`)
                }
                totalCreated++
            }
        }

        offset += Math.min(pageSize, addresses.length)
    } while (addresses.length > 0)

    console.info(`\nSummary: ${totalProcessed} addresses processed, ${totalCreated} heuristics created, ${totalSkipped} skipped, ${totalConflicts} conflicts`)
}

main(process.argv.slice(2)).then(
    () => {
        console.info('✅ All done!')
        process.exit()
    },
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
