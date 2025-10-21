#!/usr/bin/env node
/* eslint-disable no-console */
const Knex = require('knex')
const { hideBin } = require('yargs/helpers')
const yargs = require('yargs/yargs')

const { generateUUIDv4 } = require('@open-condo/miniapp-utils')

// FileRecord location + columns
const FILE_RECORD = {
    schema: 'public',
    table: 'FileRecord',
    cols: {
        id: 'id',
        fileSize: 'fileSize',
        fileMimeType: 'fileMimeType',
        fileMeta: 'fileMeta',
        user: 'user',
        organization: 'organization',
        sourceFileRecord: 'sourceFileRecord',
        sourceApp: 'sourceApp',
        fileAdapter: 'fileAdapter',
        attachments: 'attachments',
        dv: 'dv',
        sender: 'sender',
    },
}

// Default values for dv/sender if your table requires them
const DEFAULT_META = {
    dv: 1,
    sender: { dv: 1, fingerprint: 'migrator' },
}

// How we detect duplicates in FileRecord (idempotency guard)
function fileRecordExistsQuery (tRef, cols, built) {
    return tRef
        .select(1) // ensure SELECT builder
        .whereRaw('??->>\'id\' = ?', [cols.fileMeta, built.fileMeta.id || null])
        .whereRaw('??->>\'recordId\' = ?', [cols.fileMeta, String(built.fileMeta.recordId || '')])
        .whereRaw('??->>\'filename\' = ?', [cols.fileMeta, built.fileMeta.filename || ''])
        .first()
}

/**
 * Coerce a variety of DB/JSON shapes into an ID string.
 * Accepts: string UUID, { id: '...' }, number -> string, null/undefined -> null
 */
function coerceId (any) {
    if (any == null) return null
    if (typeof any === 'string' || typeof any === 'number') return String(any)
    if (typeof any === 'object' && any.id != null) return String(any.id)
    return null
}

/**
 * Build a FileRecord insert from a source file JSON + extra columns.
 * Prefers user/organization/createdBy coming from the source table over file JSON meta.
 *
 * @param {object} srcVal - file JSON from the original table/column
 * @param {object} ctx - { source: { schema, table, column, pk, idVal }, extra: { userId, orgId, createdById } }
 * @returns {object|null} - insert row, or null to skip
 */
function buildFileRecord (srcVal, ctx) {
    const {
        id,
        path,
        filename,
        originalFilename,
        mimetype,
        encoding,
        size,
        fileAdapter,
        adapter,
        storageAdapter,
        meta,
    } = srcVal || {}

    // Prefer IDs from source table columns; fall back to JSON meta/user
    const userId =
    coerceId(ctx.extra.userId) ||
    coerceId(ctx.extra.createdById) ||
    coerceId(meta?.user?.id)

    const organizationId =
    coerceId(ctx.extra.orgId) ||
    coerceId(meta?.organization?.id)

    const fileSize = size != null ? String(size) : null
    const fileMimeType = mimetype || null
    const resolvedAdapter = fileAdapter || adapter || storageAdapter || null

    const fileMeta = {
        id: id || null,
        fileAdapter: resolvedAdapter,
        recordId: ctx.source.idVal, // link back to originating record
        path: path || null,
        filename: originalFilename || filename || id || null,
        originalFilename: originalFilename || null,
        mimetype: mimetype || null,
        encoding: encoding || null,
        meta: {
            dv: meta?.dv ?? 1,
            sender: {
                dv: meta?.sender?.dv ?? 1,
                fingerprint: meta?.sender?.fingerprint ?? 'migrator',
            },
            user: userId ? { id: userId } : { id: null },
            fileClientId: meta?.fileClientId ?? null,
            modelNames: Array.isArray(meta?.modelNames) ? meta.modelNames : [],
            sourceFileClientId: meta?.sourceFileClientId ?? null,
        },
    }

    const record = {
        [FILE_RECORD.cols.fileSize]: fileSize ?? '0',
        [FILE_RECORD.cols.fileMimeType]: fileMimeType ?? 'application/octet-stream',
        [FILE_RECORD.cols.fileMeta]: fileMeta,
        [FILE_RECORD.cols.user]: userId,                         // required
        [FILE_RECORD.cols.organization]: organizationId || null,
        [FILE_RECORD.cols.sourceFileRecord]: null,
        [FILE_RECORD.cols.sourceApp]: null,
        [FILE_RECORD.cols.fileAdapter]: resolvedAdapter,
        [FILE_RECORD.cols.attachments]: {
            attachments: [
                {
                    modelName: ctx.source.table,
                    id: String(ctx.source.idVal),
                    fileClientId: fileMeta.meta.fileClientId || null,
                    user: userId || ctx.extra.createdById || null,
                },
            ],
        },
        [FILE_RECORD.cols.dv]: DEFAULT_META.dv,
        [FILE_RECORD.cols.sender]: DEFAULT_META.sender,
        id: generateUUIDv4(),
        v: 1,
    }

    // Skip if user is still missing (your schema requires user)
    if (!record[FILE_RECORD.cols.user]) return null

    return record
}


const argv = yargs(hideBin(process.argv))
    .option('schema', { type: 'string', default: 'public', desc: 'Postgres schema' })
    .option('tables', { type: 'array', desc: 'Only process these tables' })
    .option('exclude-tables', { type: 'array', desc: 'Explicit table names to exclude' })
    .option('exclude-tables-pattern', {
        type: 'string',
        default: 'HistoryRecord',
        desc: 'Regex/substring to exclude tables (case-insensitive)',
    })
    .option('batch', { type: 'number', default: 500, desc: 'Rows per batch' })
    .option('concurrency', { type: 'number', default: 4, desc: 'Row-level concurrency inside a batch' })
    .option('dry-run', { type: 'boolean', default: false, desc: 'Simulate; no writes' })
    .option('resume', { type: 'boolean', default: true, desc: 'Resume from last checkpoint' })
    .option('id-column', { type: 'string', default: 'id', desc: 'Fallback PK name' })
    .option('force-columns', { type: 'array', desc: 'Force columns Table.col to include' })

// Inventory-only mode
    .option('inventory', { type: 'boolean', default: false, desc: 'List potential file fields and exit' })
    .option('inventory-format', { type: 'string', choices: ['pretty', 'json', 'csv'], default: 'pretty' })

// Discovery defaults: json/jsonb + name pattern; can loosen via flags
    .option('include-pattern', {
        type: 'string',
        default: '(file|image|avatar|photo|picture|document|doc|pdf|attachment|asset|logo)$',
    })
    .option('exclude-pattern', { type: 'string' })
    .option('include-all-json', { type: 'boolean', default: false })
    .option('include-text', { type: 'boolean', default: false })
    .option('include-bytea', { type: 'boolean', default: false })

    .option('connection', { type: 'string' })
    .help().strict().argv

// DB connect
let knexConfig
if (argv.connection) {
    knexConfig = { client: 'pg', connection: JSON.parse(argv.connection), pool: { min: 2, max: 10 } }
} else {
    knexConfig = {
        client: 'pg',
        connection: process.env.DATABASE_URL,
        pool: { min: 2, max: 10 },
        acquireConnectionTimeout: 30000,
    }
}
const knex = Knex(knexConfig)

function createLimiter (max) {
    let active = 0; const q = []
    const next = () => {
        if (active >= max || q.length === 0) return
        active++; const { fn, res, rej } = q.shift()
        Promise.resolve().then(fn).then(v => { active--; res(v); next() })
            .catch(e => { active--; rej(e); next() })
    }
    return fn => new Promise((res, rej) => { q.push({ fn, res, rej }); next() })
}

// helpers
function tableRef (db, schema, table) {
    return db(table).withSchema(schema)
}
const qid = id => knex.ref(id)
function compileRegex (rx) {
    if (rx == null) return null
    const s = String(rx)
    if (!s) return null
    try {
        // CLI-provided discovery filters are intentionally compiled at runtime.
        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
        return new RegExp(s, 'i')
    } catch {
        return null
    }
}
function classifyPkType (pgType) {
    const t = String(pgType || '').toLowerCase()
    if (t.includes('uuid')) return 'uuid'
    if (t.includes('int') || t.includes('bigint') || t.includes('smallint') || t.includes('numeric') || t.includes('decimal')) return 'numeric'
    return 'text'
}

// schema helpers
async function fetchColumns (schema, limitToTables) {
    let q = knex.select('table_name', 'column_name', 'data_type', 'is_nullable', 'udt_name', 'ordinal_position', 'character_maximum_length')
        .from('information_schema.columns').where('table_schema', schema)
    if (limitToTables && limitToTables.length) q = q.whereIn('table_name', limitToTables.map(String))
    return q.orderBy('table_name', 'asc').orderBy('ordinal_position', 'asc')
}

function printInventory (rows) {
    if (argv['inventory-format'] === 'json') console.log(JSON.stringify(rows, null, 2))
    else {
        let current = ''
        for (const r of rows){
            if (r.table !== current) {
                current = r.table
                console.log(`\n${r.schema}.${r.table}`)
            }
            console.log(`  - ${r.column}  [${r.data_type}]  (${r.reason})`)
        }
        console.log(`\nTotal candidates: ${rows.length}`)
    }
}

// PK + checkpoints
async function primaryKeyMeta (schema, table) {
    const row = await knex
        .select(knex.raw('a.attname as column'), knex.raw('format_type(a.atttypid, a.atttypmod) as pg_type'))
        .from('pg_index as i')
        .join('pg_attribute as a', 'a.attrelid', 'i.indrelid')
        .join('pg_class as c', 'c.oid', 'i.indrelid')
        .join('pg_namespace as n', 'n.oid', 'c.relnamespace')
        .whereRaw('i.indisprimary')
        .andWhere('n.nspname', schema)
        .andWhere('c.relname', table)
        .andWhereRaw('a.attnum = ANY(i.indkey)')
        .first()
    const name = row?.column || argv['id-column']
    const colInfo = await knex.select('data_type').from('information_schema.columns').where({ table_schema:schema, table_name:table, column_name:name }).first()
    const typeClass = classifyPkType(colInfo?.data_type || row?.pg_type || '')
    return { name, typeClass }
}

function cpTbl (schema) {
    return tableRef(knex, schema, 'file_migration_checkpoints')
}
async function getCheckpoint (schema, table, column) {
    const row = await cpTbl(schema).where({ table_name:table, column_name:column }).first()
    return row?.last_id ?? null
}
async function setCheckpoint (schema, table, column, lastId){
    const exists = await cpTbl(schema).where({ table_name:table, column_name:column }).first()
    if (exists) {
        await cpTbl(schema).update({ last_id: String(lastId) }).where({ table_name: table, column_name: column })
    } else {
        await cpTbl(schema).insert({ table_name: table, column_name: column, last_id: String(lastId) })
    }
}

// -------- extra columns detection (user/organization/createdBy) ----------
async function readTableColumnNames (schema, table) {
    const rows = await knex
        .select('column_name')
        .from('information_schema.columns')
        .where({ table_schema: schema, table_name: table })
    const names = rows.map(r => r.column_name)
    const map = new Map()
    for (const n of names) map.set(n.toLowerCase(), n) // case-insensitive lookup -> real name
    return { names, byLower: map }
}

// Given column set, choose best match for each logical field
function resolveExtraColumns (colMap) {
    const pick = (...candidates) => {
        for (const c of candidates) {
            const hit = colMap.byLower.get(c.toLowerCase())
            if (hit) return hit
        }
        return null
    }
    return {
        userCol: pick('user', 'userId', 'user_id', 'createdBy', 'created_by'),
        orgCol: pick('organization', 'organizationId', 'organization_id', 'org', 'orgId', 'org_id'),
        createdByCol: pick('createdBy', 'created_by', 'author', 'authorId', 'author_id'),
    }
}

// MIGRATION: INSERT into FileRecord per source file (no source updates)
async function migrateColumn ({ schema, table, column, type }) {
    const { name: pk, typeClass: pkType } = await primaryKeyMeta(schema, table)

    // discover extra columns on this table (if any)
    const colMap = await readTableColumnNames(schema, table)
    const extras = resolveExtraColumns(colMap)

    let lastId = argv.resume ? await getCheckpoint(schema, table, column) : null
    let processed = 0; let maxSeenId = lastId

    console.log(`\n> Processing ${schema}.${table}.${column} (pk: ${pk} ${pkType}) starting from ${lastId ?? '(beginning)'} [${type}]`)
    if (extras.userCol || extras.orgCol || extras.createdByCol) {
        console.log(`  using extra columns: ${[extras.userCol, extras.orgCol, extras.createdByCol].filter(Boolean).join(', ')}`)
    }

    const limit = createLimiter(Math.max(1, argv.concurrency))

    // eslint-disable-next-line no-constant-condition
    while (true) {
        // Build select with aliases for stability
        const selectParts = [{ _id: qid(pk) }, { _val: qid(column) }]
        if (extras.userCol) selectParts.push({ _user: qid(extras.userCol) })
        if (extras.orgCol) selectParts.push({ _org: qid(extras.orgCol) })
        if (extras.createdByCol) selectParts.push({ _createdBy: qid(extras.createdByCol) })

        let qb = tableRef(knex, schema, table)
            .select(...selectParts)
            .whereRaw('?? IS NOT NULL', [column])

        if (lastId != null) {
            if (pkType === 'numeric') qb = qb.whereRaw('?? > ?', [pk, Number(lastId)])
            else if (pkType === 'uuid') qb = qb.whereRaw('?? > ?::uuid', [pk, String(lastId)])
            else qb = qb.whereRaw('?? > ?', [pk, String(lastId)])
        }

        qb = qb.orderByRaw('?? ASC', [pk]).limit(argv.batch)
        const batch = await qb
        if (batch.length === 0) break

        await knex.transaction(async (trx) => {
            const tasks = batch.map(row => limit(async () => {
                const idVal = row._id
                let val = row._val

                if (type === 'text-json' && typeof val === 'string') {
                    try { val = JSON.parse(val) } catch { val = null }
                }
                if (!val || typeof val !== 'object' || Array.isArray(val)) {
                    maxSeenId = idVal; return
                }

                const extra = {
                    userId: coerceId(row._user),
                    orgId: coerceId(row._org),
                    createdById: coerceId(row._createdBy),
                }

                const ctx = { source: { schema, table, column, pk, idVal }, extra }
                const insertRow = buildFileRecord(val, ctx)
                if (!insertRow) { maxSeenId = idVal; return }

                // Idempotency check
                const exists = await fileRecordExistsQuery(
                    tableRef(trx, FILE_RECORD.schema, FILE_RECORD.table),
                    FILE_RECORD.cols,
                    { fileMeta: insertRow[FILE_RECORD.cols.fileMeta] }
                )
                if (exists) {
                    if (argv['dry-run']) console.log(`[dry-run] skip existing FileRecord for ${table}#${idVal}.${column}`)
                    maxSeenId = idVal; return
                }

                if (argv['dry-run']) {
                    console.log(`[dry-run] INSERT into ${FILE_RECORD.schema}.${FILE_RECORD.table} from ${table}#${idVal}.${column}`)
                    console.log(JSON.stringify(insertRow, null, 2))
                    maxSeenId = idVal; return
                }

                await tableRef(trx, FILE_RECORD.schema, FILE_RECORD.table).insert(insertRow)
                maxSeenId = idVal; processed++
                if (processed % 1000 === 0) console.log(`... inserted ${processed} FileRecord(s)`)
            }))

            await Promise.all(tasks)

            if (!argv['dry-run'] && argv.resume && maxSeenId != null) {
                await setCheckpoint(schema, table, column, maxSeenId)
            }
        })

        if (String(maxSeenId) === String(lastId)) break
        lastId = maxSeenId
    }

    console.log(`Done ${schema}.${table}.${column} — inserted ${processed} FileRecord rows.`)
}

// ----- Locking (prevent concurrent runs) -------------------------------
async function withAdvisoryLock (lockKey, fn) {
    // Try to acquire a session-level advisory lock
    const got = await knex.raw('SELECT pg_try_advisory_lock(?) AS locked', [lockKey])
    const ok = got && got.rows && got.rows[0] && got.rows[0].locked
    if (!ok) throw new Error('Could not acquire advisory lock; is another migration running?')
    try {
        return await fn()
    } finally {
    // Best-effort unlock
        try {
            await knex.raw('SELECT pg_advisory_unlock(?)', [lockKey])
        } catch (_) {
            // skip
        }
    }
}


// MAIN
(async function main () {
    const LOCK_KEY = 0x66696c65 // 'file'
    const schema = argv.schema

    // Inventory (schema-only; includes empty tables)
    const inventory = await (async () => {
        const excludeTableRx = compileRegex(argv['exclude-tables-pattern'])
        const forced = new Set((argv['force-columns'] || []).map(String))
        const explicitSkip = new Set((argv['exclude-tables'] || []).map(String))
        const cols = await fetchColumns(schema, argv.tables)
        const out = []; const seen = new Set()
        for (const c of cols) {
            if (explicitSkip.has(c.table_name) || (excludeTableRx && excludeTableRx.test(c.table_name))) continue
            const key = `${c.table_name}.${c.column_name}`; if (seen.has(key)) continue
            const forcedHit = forced.has(key) || forced.has(`"${c.table_name}".${c.column_name}`) || forced.has(`${c.table_name}."${c.column_name}"`)
            if (forcedHit) { out.push({ schema, table:c.table_name, column:c.column_name, data_type:c.data_type, reason:'forced' }); seen.add(key); continue }
            const isJson = (c.data_type || '').toLowerCase().includes('json')
            const nameMatch = compileRegex(argv['include-pattern'])?.test(c.column_name)
            const allow = (isJson && (argv['include-all-json'] || nameMatch)) ||
        (argv['include-text'] && /(character varying|text|character)/i.test(c.data_type) && nameMatch) ||
        (argv['include-bytea'] && /bytea/i.test(c.data_type))
            if (allow) { out.push({ schema, table:c.table_name, column:c.column_name, data_type:c.data_type, reason: isJson ? (argv['include-all-json'] ? 'json-type' : 'json-type+name-match') : 'text/bytea' }); seen.add(key) }
        }
        return out
    })()

    if (argv.inventory || argv['dry-run']) {
        console.log('\n=== Potential file fields (inventory) ===')
        printInventory(inventory)
        if (argv.inventory) { await knex.destroy(); return }
    }

    await withAdvisoryLock(LOCK_KEY, async () => {
        if (inventory.length === 0) {
            console.log('\nNo candidate file columns discovered with current rules.')
            console.log('Try: --include-all-json | --include-text | --include-bytea | --force-columns Table.col | --exclude-tables-pattern ""')
            return
        }

        console.log('\n=== Creating FileRecord rows (no source updates) ===')
        for (const c of inventory) {
            const type = /json/.test((c.data_type || '').toLowerCase()) ? 'jsonb' : 'text-json'
            await migrateColumn({ schema, table: c.table, column: c.column, type })
        }
    })
})()
    .then(() => knex.destroy())
    .catch(err => { console.error(err); knex.destroy().finally(() => process.exit(1)) })
