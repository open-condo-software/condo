/**
 * Migrate Address.key values to the new heuristic-prefixed format.
 *
 * Current format → New format:
 *   россия~свердловская~...        → fallback:россия~свердловская~...
 *
 * Usage:
 *      yarn workspace @app/address-service node bin/migrate-address-keys-to-heuristics.js [--dry-run]
 */

const path = require('path')

const { HEURISTIC_TYPES } = require('@address-service/domains/common/constants/heuristicTypes')

const dv = 1
const sender = { dv, fingerprint: 'migrate-address-keys-to-heuristics' }
const MIGRATION_STATEMENT_TIMEOUT = '1500s'

const KNOWN_PREFIXES = HEURISTIC_TYPES.map((type) => `${type}:`)

function parseCount (value) {
    return Number.parseInt(value, 10) || 0
}

async function getCount (query) {
    const [result] = await query.count({ count: 'id' })
    return parseCount(result.count)
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

async function getStatementTimeout (knex) {
    const result = await knex.raw('SHOW statement_timeout')
    return result.rows?.[0]?.statement_timeout || null
}

async function setStatementTimeout (knex, timeout) {
    await knex.raw('SELECT set_config(?, ?, false)', ['statement_timeout', timeout])
}

function whereNotMigratedKeys (query) {
    return query.whereNot((builder) => {
        KNOWN_PREFIXES.forEach((prefix) => {
            builder.orWhere('key', 'like', `${prefix}%`)
        })
    })
}

async function loadKeystoneContext () {
    const { keystone, cors, pinoOptions } = require(path.resolve('./index.js'))
    const dev = process.env.NODE_ENV === 'development'

    // DB-only migration script: keep bootstrap minimal and skip express app preparation
    await keystone.prepare({ apps: [], dev, cors, pinoOptions })
    await keystone.connect()

    return keystone
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
    try {
        previousStatementTimeout = await getStatementTimeout(knex)
        if (previousStatementTimeout) {
            await setStatementTimeout(knex, MIGRATION_STATEMENT_TIMEOUT)
            console.info(`Session statement_timeout: ${previousStatementTimeout} -> ${MIGRATION_STATEMENT_TIMEOUT}`)
        }

        const addressQuery = () => knex('Address')
        const whereActiveWithKey = (query) => query.whereNull('deletedAt').whereNotNull('key')

        const totalCount = await getCount(whereActiveWithKey(addressQuery()))
        const fallbackToMigrateCount = await getCount(
            whereNotMigratedKeys(
                whereActiveWithKey(addressQuery())
            )
        )
        const totalToMigrate = fallbackToMigrateCount
        const alreadyMigratedCount = totalCount - totalToMigrate

        console.info(`Migration plan: total=${totalCount}, toMigrate=${totalToMigrate}, alreadyMigrated=${alreadyMigratedCount}`)
        console.info(`To migrate by type: fallback=${fallbackToMigrateCount}`)

        if (totalToMigrate === 0) {
            console.info(`\nSummary: ${totalCount} processed, 0 migrated, ${totalCount} already migrated`)
            console.info(`Execution time: ${formatDuration(Date.now() - startedAt)}`)
            return
        }

        let migratedFallbackCount = 0

        if (isDryRun) {
            migratedFallbackCount = fallbackToMigrateCount
        } else {
            const senderAsJsonb = knex.raw('?::jsonb', [JSON.stringify(sender)])

            migratedFallbackCount = await whereNotMigratedKeys(
                whereActiveWithKey(addressQuery())
            ).update({
                dv,
                sender: senderAsJsonb,
                key: knex.raw('? || "key"', ['fallback:']),
            })
        }

        const totalMigrated = migratedFallbackCount
        const remainingNotMigratedCount = await getCount(whereNotMigratedKeys(whereActiveWithKey(addressQuery())))
        const totalSkipped = Math.max(totalCount - totalMigrated, 0)

        console.info(`\nSummary: ${totalCount} processed, ${totalMigrated} migrated, ${totalSkipped} already migrated`)
        console.info(`Migrated by type: fallback=${migratedFallbackCount}`)
        console.info(`Remaining without heuristic prefix: ${remainingNotMigratedCount}`)
        console.info(`Execution time: ${formatDuration(Date.now() - startedAt)}`)
    } finally {
        if (previousStatementTimeout) {
            try {
                await setStatementTimeout(knex, previousStatementTimeout)
                console.info(`Session statement_timeout restored: ${previousStatementTimeout}`)
            } catch (restoreError) {
                console.error(`Failed to restore statement_timeout to ${previousStatementTimeout}`)
                console.error(restoreError)
            }
        }
    }
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
