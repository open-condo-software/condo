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
const { getLogger } = require('@open-condo/keystone/logging')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')
const { isFileMeta } = require('@open-condo/keystone/utils/externalContentFieldType')

const { UUID_REGEXP } = require('@condo/domains/common/constants/regexps')

const logger = getLogger('backfill-billingreceipt-raw')

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
    .requiredOption('-p, --period <period>', 'BillingReceipt.period, format YYYY-MM or YYYY-MM-DD')
    .requiredOption('-o, --organization <organizationId>', 'Organization uuid', (value) => {
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

    const period = normalizePeriod(opts.period)
    if (!period) {
        throw new Error('Invalid --period. Expected YYYY-MM or YYYY-MM-DD')
    }

    const batchSize = opts.batchSize
    if (!Number.isFinite(batchSize) || batchSize <= 0) {
        throw new Error('Invalid --batch-size')
    }

    const maxRecords = opts.maxRecords
    if (maxRecords != null && (!Number.isFinite(maxRecords) || maxRecords <= 0)) {
        throw new Error('Invalid --max-records')
    }

    const { keystone: context } = await prepareKeystoneExpressApp(
        path.resolve('./index.js'),
        { excludeApps: ['NextApp', 'AdminUIApp'] },
    )

    const knex = context.adapter.knex
    await knex.raw(`SET statement_timeout = '${MIGRATION_STATEMENT_TIMEOUT}'`)

    const adapter = new FileAdapter('BillingIntegrations', false, true)

    let processed = 0
    let lastId = opts.startFromId || null
    let lastProcessedId = null

    logger.info({
        msg: 'start',
        data: {
            period,
            organizationId: opts.organization,
            batchSize,
            startFromId: lastId,
            maxRecords,
            dryRun: Boolean(opts.dryRun),
        },
    })

    let hasMore = true
    while (hasMore) {
        const sql = `
            SELECT br."id", br."raw"
            FROM "BillingReceipt" br
            JOIN "BillingIntegrationOrganizationContext" ctx
              ON ctx."id" = br."context"
            WHERE br."deletedAt" IS NULL
              AND br."raw" IS NOT NULL
              AND br."period" = ${toSqlDateLiteral(period)}
              AND ctx."deletedAt" IS NULL
              AND ctx."organization" = ${toSqlUuidLiteral(opts.organization)}
              -- legacy Json field stored the whole JSON; new ExternalContent stores file meta (has filename)
              AND NOT (br."raw" ? 'filename')
              AND (${lastId ? `br."id" > ${toSqlUuidLiteral(lastId)}` : 'TRUE'})
            ORDER BY br."id" ASC
            LIMIT ${toSqlIntLiteral(batchSize)}
        `

        const { rows } = await knex.raw(sql)
        hasMore = rows.length > 0
        if (!hasMore) continue

        for (const row of rows) {
            const { id, raw } = row
            // Stop *before* advancing cursor to the next id.
            // Otherwise we may skip an unprocessed record on resume with --start-from-id.
            if (maxRecords && processed >= maxRecords) {
                logger.info({ msg: 'reached maxRecords', data: { maxRecords, lastProcessedId, processed } })
                hasMore = false
                break
            }

            if (!raw || isFileMeta(raw)) {
                if (!opts.dryRun) {
                    await knex.raw(`
                        UPDATE "BillingReceipt"
                        SET "raw" = ${toSqlJsonbLiteral(raw || null)}
                        WHERE "id" = ${toSqlUuidLiteral(id)}
                    `)
                }
                lastId = id
                lastProcessedId = id
                continue
            }

            if (!opts.dryRun) {
                const payload = JSON.stringify(raw ?? null)
                const stream = Readable.from([Buffer.from(payload, 'utf-8')])
                const filename = `billingreceipt-raw-${id}.${FORMAT}`

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

                await knex.raw(`
                    UPDATE "BillingReceipt"
                    SET "raw" = ${toSqlJsonbLiteral(saved)}
                    WHERE "id" = ${toSqlUuidLiteral(id)}
                `)
            }

            processed += 1
            lastId = id
            lastProcessedId = id

            if (processed % opts.progressEvery === 0) {
                logger.info({ msg: 'progress', data: { processed, lastProcessedId } })
            }
        }

        if (maxRecords && processed >= maxRecords) break
    }

    await knex.raw('SET statement_timeout = \'10s\'')
    logger.info({ msg: 'done', data: { processed, lastId } })
}

main().then(() => {
    console.info('✅ All done!')
    process.exit()
}).catch((e) => {
    console.error(e)
    process.exit(1)
})

