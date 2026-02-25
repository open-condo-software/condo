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

const { randomUUID } = require('crypto')
const path = require('path')

const get = require('lodash/get')

const {
    HEURISTIC_TYPE_FIAS_ID,
    HEURISTIC_TYPE_COORDINATES,
    HEURISTIC_TYPE_GOOGLE_PLACE_ID,
    HEURISTIC_TYPE_FALLBACK,
} = require('@address-service/domains/common/constants/heuristicTypes')
const {
    DADATA_PROVIDER,
    GOOGLE_PROVIDER,
} = require('@address-service/domains/common/constants/providers')

const dv = 1
const sender = { dv, fingerprint: 'create-address-heuristics' }
const MIGRATION_STATEMENT_TIMEOUT = '1500s'
const COORDINATE_TOLERANCE = 0.00001
const PAGE_SIZE = 1000
const PROGRESS_LOG_EVERY_PAGES = 10

function hasExactGeoQuality (meta) {
    return String(get(meta, ['data', 'qc_geo'])) === '0'
}

/**
 * Parse Address.key to determine primary heuristic type and value
 */
function parseAddressKey (key) {
    if (key.startsWith('fallback:')) {
        return { type: HEURISTIC_TYPE_FALLBACK, value: key.slice('fallback:'.length), reliability: 10 }
    }
    if (key.startsWith('coordinates:')) {
        return { type: HEURISTIC_TYPE_COORDINATES, value: key.slice('coordinates:'.length), reliability: 70 }
    }
    if (key.startsWith('google_place_id:')) {
        return { type: HEURISTIC_TYPE_GOOGLE_PLACE_ID, value: key.slice('google_place_id:'.length), reliability: 95 }
    }
    if (key.startsWith('fias_id:')) {
        return { type: HEURISTIC_TYPE_FIAS_ID, value: key.slice('fias_id:'.length), reliability: 95 }
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
    const providerName = get(meta, ['provider', 'name'])

    const houseFiasId = get(data, 'house_fias_id')
    if (houseFiasId && primaryType !== HEURISTIC_TYPE_FIAS_ID) {
        heuristics.push({
            type: HEURISTIC_TYPE_FIAS_ID,
            value: houseFiasId,
            reliability: 95,
            meta: null,
        })
    }

    // Coordinates
    if (primaryType !== HEURISTIC_TYPE_COORDINATES) {
        if (providerName === DADATA_PROVIDER) {
            const geoLat = get(data, 'geo_lat')
            const geoLon = get(data, 'geo_lon')
            if (geoLat && geoLon && hasExactGeoQuality(meta)) {
                const qcGeo = get(data, 'qc_geo')
                heuristics.push({
                    type: HEURISTIC_TYPE_COORDINATES,
                    value: `${geoLat},${geoLon}`,
                    reliability: 90,
                    meta: qcGeo != null ? { qc_geo: qcGeo } : null,
                })
            }
        }

        if (providerName === GOOGLE_PROVIDER) {
            const rawGeoLat = get(meta, ['provider', 'rawData', 'geometry', 'location', 'lat'])
            const rawGeoLon = get(meta, ['provider', 'rawData', 'geometry', 'location', 'lng'])
            if (rawGeoLat != null && rawGeoLon != null) {
                heuristics.push({
                    type: HEURISTIC_TYPE_COORDINATES,
                    value: `${rawGeoLat},${rawGeoLon}`,
                    reliability: 80,
                    meta: null,
                })
            }
        }
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

function parseCoordinates (value) {
    const [latitude, longitude] = String(value).split(',').map(parseFloat)
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null
    return { latitude, longitude }
}

function formatDuration (durationMs) {
    const totalSeconds = Math.floor(durationMs / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return [hours, minutes, seconds]
        .map(value => String(value).padStart(2, '0'))
        .join(':')
}

function formatProgressPercent (processed, total) {
    if (total <= 0) return '100.00'
    return ((processed / total) * 100).toFixed(2)
}

async function loadKeystoneContext () {
    const { keystone, cors, pinoOptions } = require(path.resolve('./index.js'))
    const dev = process.env.NODE_ENV === 'development'

    await keystone.prepare({ apps: [], dev, cors, pinoOptions })
    await keystone.connect()

    return keystone
}

async function getStatementTimeout (knex) {
    const result = await knex.raw('SHOW statement_timeout')
    return result.rows?.[0]?.statement_timeout || null
}

async function setStatementTimeout (knex, timeout) {
    await knex.raw('SELECT set_config(?, ?, false)', ['statement_timeout', timeout])
}

async function loadAddressPage (knex, offset) {
    return await knex('Address')
        .select('id', 'key', 'meta')
        .whereNull('deletedAt')
        .whereNotNull('key')
        .orderBy('createdAt', 'asc')
        .offset(offset)
        .limit(PAGE_SIZE)
}

function getHeuristicKey (type, value) {
    return `${type}\u0000${value}`
}

async function loadExactHeuristicMap (knex, heuristicPairs) {
    if (heuristicPairs.length === 0) return new Map()

    const uniquePairsMap = new Map()
    for (const pair of heuristicPairs) {
        uniquePairsMap.set(getHeuristicKey(pair.type, pair.value), pair)
    }

    const uniquePairs = [...uniquePairsMap.values()]
    const rows = await knex('AddressHeuristic')
        .select('id', 'address', 'type', 'value')
        .whereNull('deletedAt')
        .where('enabled', true)
        .whereIn(['type', 'value'], uniquePairs.map(({ type, value }) => [type, value]))

    const result = new Map()
    for (const row of rows) {
        const key = getHeuristicKey(row.type, row.value)
        if (!result.has(key)) {
            result.set(key, row)
        }
    }

    return result
}

async function loadCoordinateCandidates (knex, coordinateValues) {
    const parsedCoordinates = coordinateValues
        .map(parseCoordinates)
        .filter(Boolean)

    if (parsedCoordinates.length === 0) return []

    const latitudes = parsedCoordinates.map(({ latitude }) => latitude)
    const longitudes = parsedCoordinates.map(({ longitude }) => longitude)

    const minLatitude = String(Math.min(...latitudes) - COORDINATE_TOLERANCE)
    const maxLatitude = String(Math.max(...latitudes) + COORDINATE_TOLERANCE)
    const minLongitude = String(Math.min(...longitudes) - COORDINATE_TOLERANCE)
    const maxLongitude = String(Math.max(...longitudes) + COORDINATE_TOLERANCE)

    return await knex('AddressHeuristic')
        .select('id', 'address', 'latitude', 'longitude')
        .whereNull('deletedAt')
        .where('enabled', true)
        .where('type', HEURISTIC_TYPE_COORDINATES)
        .where('latitude', '>=', minLatitude)
        .where('latitude', '<=', maxLatitude)
        .where('longitude', '>=', minLongitude)
        .where('longitude', '<=', maxLongitude)
}

function findCoordinateConflict (coordinateCandidates, value) {
    const coords = parseCoordinates(value)
    if (!coords) return null

    return coordinateCandidates.find((candidate) => {
        const candidateLatitude = Number.parseFloat(candidate.latitude)
        const candidateLongitude = Number.parseFloat(candidate.longitude)
        if (Number.isNaN(candidateLatitude) || Number.isNaN(candidateLongitude)) return false

        return Math.abs(candidateLatitude - coords.latitude) <= COORDINATE_TOLERANCE &&
            Math.abs(candidateLongitude - coords.longitude) <= COORDINATE_TOLERANCE
    }) || null
}

async function findRootAddress (knex, initialAddressId, cache, maxDepth = 10) {
    if (cache.has(initialAddressId)) return cache.get(initialAddressId)

    let currentAddressId = initialAddressId
    let lastAliveAddressId = initialAddressId
    let depth = 0

    while (depth < maxDepth) {
        const address = await knex('Address')
            .select('id', 'possibleDuplicateOf', 'deletedAt')
            .where('id', currentAddressId)
            .first()

        if (!address || address.deletedAt) break

        lastAliveAddressId = address.id

        if (!address.possibleDuplicateOf) {
            cache.set(initialAddressId, lastAliveAddressId)
            return lastAliveAddressId
        }

        currentAddressId = address.possibleDuplicateOf
        depth++
    }

    cache.set(initialAddressId, lastAliveAddressId)
    return lastAliveAddressId
}

async function main (args) {
    const startedAt = Date.now()
    const isDryRun = args.includes('--dry-run')
    if (isDryRun) {
        console.info('🔍 DRY RUN mode — no changes will be written')
    }

    const context = await loadKeystoneContext()
    const knex = context.adapter.knex

    let previousStatementTimeout
    previousStatementTimeout = await getStatementTimeout(knex)
    if (previousStatementTimeout) {
        await setStatementTimeout(knex, MIGRATION_STATEMENT_TIMEOUT)
        console.info(`Session statement_timeout: ${previousStatementTimeout} -> ${MIGRATION_STATEMENT_TIMEOUT}`)
    }

    let offset = 0
    let totalProcessed = 0
    let totalCreated = 0
    let totalSkipped = 0
    let totalConflicts = 0
    let totalHeuristicsEvaluated = 0
    let totalDuplicateLinksSet = 0
    let pagesProcessed = 0
    const rootAddressCache = new Map()
    let hasMore = true
    const createdByType = {
        [HEURISTIC_TYPE_FIAS_ID]: 0,
        [HEURISTIC_TYPE_FALLBACK]: 0,
        [HEURISTIC_TYPE_COORDINATES]: 0,
        [HEURISTIC_TYPE_GOOGLE_PLACE_ID]: 0,
    }
    const conflictsByType = {
        [HEURISTIC_TYPE_FIAS_ID]: 0,
        [HEURISTIC_TYPE_FALLBACK]: 0,
        [HEURISTIC_TYPE_COORDINATES]: 0,
        [HEURISTIC_TYPE_GOOGLE_PLACE_ID]: 0,
    }

    const totalAddresses = await knex('Address')
        .whereNull('deletedAt')
        .whereNotNull('key')
        .count({ count: 'id' })
        .first()
    const totalToProcess = Number.parseInt(totalAddresses?.count, 10) || 0

    console.info(`Plan: ${totalToProcess} addresses to process (page size: ${PAGE_SIZE})`)

    try {
        while (hasMore) {
            const addresses = await loadAddressPage(knex, offset)
            if (addresses.length === 0) {
                hasMore = false
                continue
            }

            pagesProcessed++
            totalProcessed += addresses.length

            const addressHeuristics = addresses.map((address) => {
                const providerName = get(address, ['meta', 'provider', 'name'], 'unknown')
                const primary = parseAddressKey(address.key)
                const additional = extractAdditionalHeuristics(address.meta, primary.type)
                const shouldSkipPrimaryCoordinates = primary.type === HEURISTIC_TYPE_COORDINATES &&
                    providerName === DADATA_PROVIDER &&
                    !hasExactGeoQuality(address.meta)
                const primaryHeuristic = shouldSkipPrimaryCoordinates
                    ? null
                    : primary

                const heuristics = primaryHeuristic
                    ? [primaryHeuristic, ...additional]
                    : additional

                return {
                    addressId: address.id,
                    providerName,
                    heuristics,
                }
            })

            const exactPairs = []
            const coordinateValues = []
            for (const item of addressHeuristics) {
                for (const heuristic of item.heuristics) {
                    exactPairs.push({ type: heuristic.type, value: heuristic.value })
                    if (heuristic.type === HEURISTIC_TYPE_COORDINATES) {
                        coordinateValues.push(heuristic.value)
                    }
                }
            }

            const exactHeuristicMap = await loadExactHeuristicMap(knex, exactPairs)
            const coordinateCandidates = await loadCoordinateCandidates(knex, coordinateValues)
            const mutableExactHeuristicMap = new Map(exactHeuristicMap)
            const mutableCoordinateCandidates = [...coordinateCandidates]
            const heuristicsToInsert = []

            for (const item of addressHeuristics) {
                for (const heuristic of item.heuristics) {
                    totalHeuristicsEvaluated++
                    const exactKey = getHeuristicKey(heuristic.type, heuristic.value)
                    let existing = mutableExactHeuristicMap.get(exactKey)

                    if (!existing && heuristic.type === HEURISTIC_TYPE_COORDINATES) {
                        existing = findCoordinateConflict(mutableCoordinateCandidates, heuristic.value)
                    }

                    if (existing) {
                        if (existing.address === item.addressId) {
                            totalSkipped++
                            continue
                        }

                        totalConflicts++
                        conflictsByType[heuristic.type] = (conflictsByType[heuristic.type] || 0) + 1
                        if (!isDryRun) {
                            const rootAddressId = await findRootAddress(knex, existing.address, rootAddressCache)
                            await knex('Address')
                                .where('id', item.addressId)
                                .update({
                                    dv,
                                    sender: knex.raw('?::jsonb', [JSON.stringify(sender)]),
                                    possibleDuplicateOf: rootAddressId,
                                })
                            totalDuplicateLinksSet++
                        }
                        continue
                    }

                    totalCreated++
                    createdByType[heuristic.type] = (createdByType[heuristic.type] || 0) + 1
                    if (isDryRun) continue

                    const createData = {
                        id: randomUUID(),
                        v: 1,
                        dv,
                        sender,
                        address: item.addressId,
                        type: heuristic.type,
                        value: heuristic.value,
                        reliability: heuristic.reliability,
                        provider: item.providerName,
                        meta: heuristic.meta || null,
                        enabled: true,
                    }

                    if (heuristic.type === HEURISTIC_TYPE_COORDINATES) {
                        const coords = parseCoordinates(heuristic.value)
                        if (coords) {
                            createData.latitude = String(coords.latitude)
                            createData.longitude = String(coords.longitude)
                            mutableCoordinateCandidates.push({
                                address: item.addressId,
                                latitude: createData.latitude,
                                longitude: createData.longitude,
                            })
                        }
                    }

                    mutableExactHeuristicMap.set(exactKey, {
                        address: item.addressId,
                        type: heuristic.type,
                        value: heuristic.value,
                    })

                    heuristicsToInsert.push(createData)
                }
            }

            if (!isDryRun && heuristicsToInsert.length > 0) {
                await knex.batchInsert('AddressHeuristic', heuristicsToInsert, 1000)
            }

            offset += addresses.length
            if (pagesProcessed % PROGRESS_LOG_EVERY_PAGES === 0 || totalProcessed >= totalToProcess) {
                const elapsedMs = Date.now() - startedAt
                const remainingItems = Math.max(totalToProcess - totalProcessed, 0)
                const avgMsPerItem = totalProcessed > 0 ? elapsedMs / totalProcessed : 0
                const etaMs = Math.round(avgMsPerItem * remainingItems)
                const progressPercent = formatProgressPercent(totalProcessed, totalToProcess)

                console.info(
                    `Progress: ${totalProcessed}/${totalToProcess} (${progressPercent}%) | ` +
                    `elapsed=${formatDuration(elapsedMs)} | eta=${formatDuration(etaMs)} | ` +
                    `created=${totalCreated} | conflicts=${totalConflicts}`
                )
            }
        }
    } finally {
        if (previousStatementTimeout) {
            await setStatementTimeout(knex, previousStatementTimeout)
            console.info(`Session statement_timeout restored: ${previousStatementTimeout}`)
        }
    }

    console.info('\nSummary:')
    console.info(`  Addresses processed: ${totalProcessed}/${totalToProcess}`)
    console.info(`  Pages processed: ${pagesProcessed}`)
    console.info(`  Heuristics evaluated: ${totalHeuristicsEvaluated}`)
    console.info(`  Heuristics created: ${totalCreated}`)
    console.info(`    - fias_id: ${createdByType[HEURISTIC_TYPE_FIAS_ID]}`)
    console.info(`    - fallback: ${createdByType[HEURISTIC_TYPE_FALLBACK]}`)
    console.info(`    - coordinates: ${createdByType[HEURISTIC_TYPE_COORDINATES]}`)
    console.info(`    - google_place_id: ${createdByType[HEURISTIC_TYPE_GOOGLE_PLACE_ID]}`)
    console.info(`  Skipped (already linked to same address): ${totalSkipped}`)
    console.info(`  Conflicts: ${totalConflicts}`)
    console.info(`    - fias_id: ${conflictsByType[HEURISTIC_TYPE_FIAS_ID]}`)
    console.info(`    - fallback: ${conflictsByType[HEURISTIC_TYPE_FALLBACK]}`)
    console.info(`    - coordinates: ${conflictsByType[HEURISTIC_TYPE_COORDINATES]}`)
    console.info(`    - google_place_id: ${conflictsByType[HEURISTIC_TYPE_GOOGLE_PLACE_ID]}`)
    console.info(`  possibleDuplicateOf links ${isDryRun ? 'planned' : 'updated'}: ${isDryRun ? totalConflicts : totalDuplicateLinksSet}`)
    console.info(`Execution time: ${formatDuration(Date.now() - startedAt)}`)
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
