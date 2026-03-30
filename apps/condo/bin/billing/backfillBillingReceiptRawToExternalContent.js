/**
 * Backfills BillingReceipt.raw from inline Json to ExternalContent (file-meta) for a specific period and organization.
 *
 * Usage:
 *   yarn workspace @app/condo node bin/billing/backfillBillingReceiptRawToExternalContent \
 *     --period 2025-01 --organization <organizationId>
 */
const path = require('path')
const { Readable } = require('stream')

const commander = require('commander')
const dayjs = require('dayjs')

const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')
const { isFileMeta } = require('@open-condo/keystone/utils/externalContentFieldType')

const { UUID_REGEXP } = require('@condo/domains/common/constants/regexps')

const { prompt } = require('../lib/prompt')

const FORMAT = 'json'
const MIMETYPE = 'application/json'
const MIGRATION_STATEMENT_TIMEOUT = '1500s'

function toSqlStringLiteral (value) {
    return `'${String(value).replace(/'/g, '\'\'')}'`
}

function toSqlIntLiteral (value) {
    const num = Number.parseInt(String(value), 10)
    if (!Number.isFinite(num)) throw new Error(`Invalid int literal: ${value}`)
    return String(num)
}

function toSqlUuidLiteral (value) {
    return `${toSqlStringLiteral(value)}::uuid`
}

function toSqlDateLiteral (value) {
    return `${toSqlStringLiteral(value)}::date`
}

function toSqlJsonbLiteral (value) {
    if (value == null) return 'NULL::jsonb'
    return `${toSqlStringLiteral(JSON.stringify(value))}::jsonb`
}

function normalizePeriod (periodRaw) {
    // Accept YYYY-MM or YYYY-MM-DD; normalize to month start date string (YYYY-MM-01)
    if (!periodRaw || typeof periodRaw !== 'string') return null
    const trimmed = periodRaw.trim()
    const asMonth = dayjs(`${trimmed}-01`, 'YYYY-MM-DD', true)
    if (asMonth.isValid()) return asMonth.format('YYYY-MM-01')

    const asDate = dayjs(trimmed, 'YYYY-MM-DD', true)
    if (asDate.isValid()) return asDate.startOf('month').format('YYYY-MM-01')

    return null
}

const program = new commander.Command()
program
    .option('-p, --period <period>', 'BillingReceipt.period, format YYYY-MM or YYYY-MM-DD')
    .option('-o, --organization <organizationId>', 'Organization uuid', (value) => {
        if (!UUID_REGEXP.test(value)) throw new commander.InvalidArgumentError('Not a UUID.')
        return value
    })
    .option('--batch-size <n>', 'Rows per page (default: 250)', (v) => parseInt(v, 10), 250)
    .option('--start-from-id <uuid>', 'Resume from BillingReceipt.id (exclusive)', (value) => {
        if (!UUID_REGEXP.test(value)) throw new commander.InvalidArgumentError('Not a UUID.')
        return value
    })
    .option('--max-records <n>', 'Stop after processing N records', (v) => parseInt(v, 10))
    .option('--progress-every <n>', 'Log progress every N processed records (default: 1000)', (v) => parseInt(v, 10), 1000)
    .option('--dry-run', 'Do not write files or update database', false)

async function main () {
    program.parse()
    const opts = program.opts()

    const period = opts.period ? normalizePeriod(opts.period) : null
    if (opts.period && !period) {
        throw new Error('Invalid --period. Expected YYYY-MM or YYYY-MM-DD')
    }

    const warnings = []
    if (!period) warnings.push('--period is not set: ALL periods will be processed')
    if (!opts.organization) warnings.push('--organization is not set: ALL organizations will be processed')

    if (warnings.length > 0) {
        console.log('\n⚠️  Warning:')
        for (const w of warnings) console.log(`   ${w}`)
        console.log('')
        const answer = await prompt('Are you sure you want to continue? (Y/N)')
        if (answer !== 'Y') {
            console.log('Aborted.')
            process.exit(0)
        }
    }

    const batchSize = opts.batchSize
    if (!Number.isFinite(batchSize) || batchSize <= 0) {
        throw new Error('Invalid --batch-size')
    }

    const maxRecords = opts.maxRecords
    if (maxRecords != null && (!Number.isFinite(maxRecords) || maxRecords <= 0)) {
        throw new Error('Invalid --max-records')
    }

    const progressEvery = opts.progressEvery
    if (!Number.isFinite(progressEvery) || progressEvery <= 0) {
        throw new Error('Invalid --progress-every')
    }

    const { keystone: context } = await prepareKeystoneExpressApp(
        path.resolve('./index.js'),
        { excludeApps: ['NextApp', 'AdminUIApp'] },
    )

    const knex = context.adapter.knex
    await knex.raw(`SET statement_timeout = '${MIGRATION_STATEMENT_TIMEOUT}'`)

    // IMPORTANT: Keep adapter folder name consistent with schema definition.
    // This folder name MUST match BillingReceiptRawFieldFileAdapter in:
    // apps/condo/domains/billing/schema/fields/common.js
    // If they don't match, files will be saved to different locations and won't be readable.
    // Keep adapter config consistent with schema (saveFileName=false).
    // Deterministic filenames are still achieved by passing stable `id` to adapter.save().
    const adapter = new FileAdapter('BillingReceiptRawField')

    let processed = 0
    let lastId = opts.startFromId || null
    let lastProcessedId = null

    console.log('\n🚀 Starting backfill...')
    console.log('Configuration:')
    console.log(`  Period: ${period || 'ALL'}`)
    console.log(`  Organization: ${opts.organization || 'ALL'}`)
    console.log(`  Batch size: ${batchSize}`)
    console.log(`  Start from ID: ${lastId || 'beginning'}`)
    console.log(`  Max records: ${maxRecords || 'unlimited'}`)
    console.log(`  Dry run: ${opts.dryRun ? 'YES (no changes will be made)' : 'NO'}`)
    console.log('\n📋 Process:')
    console.log('  1. Query BillingReceipts with inline JSON raw data')
    console.log('  2. Save JSON content to external files')
    console.log('  3. Update database with file metadata references')
    console.log('')

    let hasMore = true
    let batchNumber = 0
    while (hasMore) {
        batchNumber++
        console.log(`\n🔍 Fetching batch #${batchNumber} (up to ${batchSize} records)...`)
        const sql = `
            SELECT br."id", br."raw"
            FROM "BillingReceipt" br
            JOIN "BillingIntegrationOrganizationContext" ctx
              ON ctx."id" = br."context"
            WHERE br."deletedAt" IS NULL
              AND br."raw" IS NOT NULL
              ${period ? `AND br."period" = ${toSqlDateLiteral(period)}` : ''}
              AND ctx."deletedAt" IS NULL
              ${opts.organization ? `AND ctx."organization" = ${toSqlUuidLiteral(opts.organization)}` : ''}
              -- legacy Json field stored the whole JSON; new ExternalContent stores file meta (has filename)
              AND NOT (br."raw" ? 'filename')
              AND (${lastId ? `br."id" > ${toSqlUuidLiteral(lastId)}` : 'TRUE'})
            ORDER BY br."id" ASC
            LIMIT ${toSqlIntLiteral(batchSize)}
        `

        const { rows } = await knex.raw(sql)
        hasMore = rows.length > 0
        if (!hasMore) {
            console.log('   No more records found.')
            continue
        }
        console.log(`   Found ${rows.length} record(s) to process`)

        for (const row of rows) {
            const { id, raw } = row
            // Stop *before* advancing cursor to the next id.
            // Otherwise we may skip an unprocessed record on resume with --start-from-id.
            if (maxRecords && processed >= maxRecords) {
                console.log(`\n⚠️  Reached max records limit (${maxRecords}). Stopping.`)
                console.log(`   Last processed ID: ${lastProcessedId}`)
                hasMore = false
                break
            }

            if (!raw || isFileMeta(raw)) {
                console.log(`   ⏭️  Skipping ${id}: already has file metadata or null`)
                lastId = id
                // Don't update lastProcessedId for skipped records - only for actually processed ones
                continue
            }

            if (opts.dryRun) {
                const payloadSize = Buffer.byteLength(JSON.stringify(raw ?? null), 'utf-8')
                console.log(`   🔍 [DRY RUN] Would save ${id}: ${(payloadSize / 1024).toFixed(2)} KB`)
            } else {
                const payload = JSON.stringify(raw ?? null)
                const payloadSize = Buffer.byteLength(payload, 'utf-8')
                const stream = Readable.from([Buffer.from(payload, 'utf-8')])
                const filename = `billingreceipt-raw-${id}.${FORMAT}`

                console.log(`   💾 Saving ${id}: ${(payloadSize / 1024).toFixed(2)} KB → ${filename}`)
                const saved = await adapter.save({
                    stream,
                    filename,
                    mimetype: MIMETYPE,
                    encoding: 'utf-8',
                    id,
                    meta: {
                        format: FORMAT,
                        listkey: 'BillingReceipt',
                        field: 'raw',
                        source: 'bin/backfillBillingReceiptRawToExternalContent',
                        organization: opts.organization,
                        period,
                    },
                })

                console.log(`   ✏️  Updating database record ${id} with file metadata`)
                await knex.raw(`
                    UPDATE "BillingReceipt"
                    SET "raw" = ${toSqlJsonbLiteral(saved)}
                    WHERE "id" = ${toSqlUuidLiteral(id)}
                `)
            }

            processed += 1
            lastId = id
            lastProcessedId = id

            if (processed % progressEvery === 0) {
                console.log(`📊 Progress: ${processed} records processed (last processed ID: ${lastProcessedId})`)  
            }
        }

        if (maxRecords && processed >= maxRecords) break
    }

    await knex.raw('SET statement_timeout = \'10s\'')
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ Backfill completed!')
    console.log('='.repeat(60))
    console.log(`   Total records processed: ${processed}`)
    console.log(`   Total batches: ${batchNumber}`)
    console.log(`   Last cursor position (ID): ${lastId || 'none'}`)
    console.log(`   Last processed record (ID): ${lastProcessedId || 'none'}`)
    if (opts.dryRun) {
        console.log('\n   ⚠️  DRY RUN - No changes were made to the database')
        console.log('   Run without --dry-run to apply changes')
    } else {
        console.log('\n   ✅ All changes have been saved to the database')
    }
    console.log('='.repeat(60))
}

main().then(() => {
    console.info('✅ All done!')
    process.exit()
}).catch((e) => {
    console.error(e)
    process.exit(1)
})

