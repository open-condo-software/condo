/**
 * Migrate Address.key values to the new heuristic-prefixed format.
 *
 * Current format → New format:
 *   fias:<uuid>                    → fias_id:<uuid>
 *   россия~свердловская~...        → fallback:россия~свердловская~...
 *
 * Usage:
 *      yarn workspace @app/address-service node bin/migrate-address-keys-to-heuristics.js [--dry-run]
 */

const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { Address } = require('@address-service/domains/address/utils/serverSchema')
const { HEURISTIC_TYPES } = require('@address-service/domains/common/constants/heuristicTypes')

const dv = 1
const sender = { dv, fingerprint: 'migrate-address-keys-to-heuristics' }

const KNOWN_PREFIXES = HEURISTIC_TYPES.map((type) => `${type}:`)

function isAlreadyMigrated (key) {
    return KNOWN_PREFIXES.some((prefix) => key.startsWith(prefix))
}

function migrateKey (key) {
    if (isAlreadyMigrated(key)) return key

    // Old FIAS format: fias:<uuid>
    if (key.startsWith('fias:')) {
        return `fias_id:${key.slice('fias:'.length)}`
    }

    // Everything else is a fallback key
    return `fallback:${key}`
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
    let totalMigrated = 0
    let totalSkipped = 0

    let addresses
    do {
        addresses = await Address.getAll(context, { deletedAt: null }, {
            first: pageSize,
            skip: offset,
            sortBy: ['createdAt_ASC'],
        }, 'id key')

        for (const address of addresses) {
            totalProcessed++

            if (isAlreadyMigrated(address.key)) {
                totalSkipped++
                continue
            }

            const newKey = migrateKey(address.key)

            if (isDryRun) {
                console.info(`  [DRY RUN] ${address.id}: ${address.key} → ${newKey}`)
            } else {
                await Address.update(context, address.id, { dv, sender, key: newKey })
                console.info(`  ${address.id}: ${address.key} → ${newKey}`)
            }
            totalMigrated++
        }

        offset += Math.min(pageSize, addresses.length)
    } while (addresses.length > 0)

    console.info(`\nSummary: ${totalProcessed} processed, ${totalMigrated} migrated, ${totalSkipped} already migrated`)
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
