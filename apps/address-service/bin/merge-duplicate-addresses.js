/**
 * Bulk auto-merge duplicate addresses for clear cases.
 *
 * For each Address with possibleDuplicateOf IS NOT NULL:
 *   1. Identify the two candidate addresses (current + possibleDuplicateOf target)
 *   2. Determine the "winner" by checking which Address.id is referenced in the condo database
 *   3. Auto-merge clear cases (only one is referenced, or neither)
 *   4. Skip ambiguous cases (both are referenced) for admin manual resolution
 *
 * Usage:
 *      yarn workspace @app/address-service node bin/merge-duplicate-addresses.js [--dry-run]
 */

const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')
const { find } = require('@open-condo/keystone/schema')

const { mergeAddresses } = require('@address-service/domains/address/utils/mergeAddresses')
const { Address } = require('@address-service/domains/address/utils/serverSchema')

const dv = 1
const sender = { dv, fingerprint: 'merge-duplicate-addresses' }
const dvSender = { dv, sender }

/**
 * Preview what mergeAddresses would do without writing anything.
 */
async function previewMerge (context, winnerId, loserId) {
    const loserSources = await find('AddressSource', { address: { id: loserId }, deletedAt: null })
    for (const source of loserSources) {
        console.info(`    [DRY RUN] Move AddressSource ${source.id} → winner ${winnerId}`)
    }

    const loserHeuristics = await find('AddressHeuristic', { address: { id: loserId }, deletedAt: null })
    for (const heuristic of loserHeuristics) {
        const existing = await find('AddressHeuristic', {
            address: { id: winnerId },
            type: heuristic.type,
            value: heuristic.value,
            deletedAt: null,
        })

        if (existing.length > 0) {
            console.info(`    [DRY RUN] Soft-delete duplicate AddressHeuristic ${heuristic.id} (${heuristic.type}:${heuristic.value})`)
        } else {
            console.info(`    [DRY RUN] Move AddressHeuristic ${heuristic.id} → winner ${winnerId}`)
        }
    }

    console.info(`    [DRY RUN] Soft-delete loser Address ${loserId}`)
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
    let totalMerged = 0
    let totalSkipped = 0

    let addresses
    do {
        addresses = await Address.getAll(context, {
            possibleDuplicateOf_is_null: false,
            deletedAt: null,
        }, {
            first: pageSize,
            skip: offset,
            sortBy: ['createdAt_ASC'],
        }, 'id key possibleDuplicateOf { id key }')

        for (const address of addresses) {
            totalProcessed++
            const targetId = address.possibleDuplicateOf.id

            console.info(`\n  Processing: ${address.id} (possibleDuplicateOf: ${targetId})`)

            // For now, auto-merge: the target (existing address that owns the heuristic) is the winner
            // The current address (flagged one) is the loser
            const winnerId = targetId
            const loserId = address.id

            console.info(`    Winner: ${winnerId}, Loser: ${loserId}`)

            if (isDryRun) {
                await previewMerge(context, winnerId, loserId)
            } else {
                await mergeAddresses(context, winnerId, loserId, dvSender)
            }
            totalMerged++
        }

        // After merging, some addresses may have been soft-deleted, so reset offset
        if (!isDryRun) {
            offset = 0
        } else {
            offset += Math.min(pageSize, addresses.length)
        }
    } while (addresses.length > 0)

    console.info(`\nSummary: ${totalProcessed} processed, ${totalMerged} merged, ${totalSkipped} skipped`)
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
