#!/usr/bin/env node
/**
 * CI / local: enable cross-database routing for selected condo tables.
 *
 * Runs after `bin/prepare.js` (single-DB migrate). Creates dedicated databases,
 * copies table DDL from main, optionally copies row data, and rewrites apps/condo/.env.
 *
 * Main DB tables are left in place; routing rules send queries to external pools.
 *
 * Usage:
 *   node bin/configure-external-db-storage.js
 *   node bin/configure-external-db-storage.js --copy-data
 */

const fs = require('fs')
const path = require('path')

const { Client } = require('pg')

const { prepareAppEnv } = require('../packages/cli')

const CONDO_ENV = path.join(__dirname, '../apps/condo/.env')
const PG = 'postgresql://postgres:postgres@127.0.0.1:5432'
const ADMIN_URL = `${PG}/postgres`

const EXTERNAL_POOLS = [
    {
        poolName: 'message',
        dbSuffix: '_message',
        tables: ['Message', 'MessageHistoryRecord'],
    },
    // {
    //     poolName: 'billing',
    //     dbSuffix: '_billing',
    //     tables: [
    //         'BillingReceipt',
    //         'BillingReceiptHistoryRecord',
    //         'BillingReceiptFile',
    //         'BillingReceiptFileHistoryRecord',
    //     ],
    // },
]

function quoteIdent (name) {
    return `"${String(name).replace(/"/g, '""')}"`
}

function readMainDbName (envPath) {
    const line = fs.readFileSync(envPath, 'utf8').split(/\r?\n/).find(l => l.startsWith('DATABASE_URL='))
    if (!line) throw new Error(`DATABASE_URL missing in ${envPath}`)

    const url = line.slice('DATABASE_URL='.length)
    const mainUrl = url.startsWith('custom:') ? JSON.parse(url.slice('custom:'.length)).main : url
    return new URL(mainUrl).pathname.slice(1)
}

async function withClient (url, fn) {
    const client = new Client({ connectionString: url })
    await client.connect()
    try {
        return await fn(client)
    } finally {
        await client.end()
    }
}

async function ensureDatabase (dbName) {
    await withClient(ADMIN_URL, async (admin) => {
        const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
        if (!rows.length) {
            await admin.query(`CREATE DATABASE ${quoteIdent(dbName)}`)
        }
    })
}

async function tableExists (client, tableName) {
    const { rows } = await client.query(`
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
    `, [tableName])
    return rows.length > 0
}

/** Copy one table's DDL (columns, constraints, indexes) from source to target connection. */
async function copyTableSchema (source, target, tableName) {
    const regclass = `"public".${quoteIdent(tableName)}`
    const { rows: columns } = await source.query(`
        SELECT a.attname AS name,
               pg_catalog.format_type(a.atttypid, a.atttypmod) AS type,
               a.attnotnull AS not_null,
               pg_get_expr(ad.adbin, ad.adrelid) AS default_expr
        FROM pg_attribute a
        LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
        WHERE a.attrelid = $1::regclass AND a.attnum > 0 AND NOT a.attisdropped
        ORDER BY a.attnum
    `, [regclass])

    const { rows: constraints } = await source.query(`
        SELECT conname, pg_get_constraintdef(oid, true) AS def
        FROM pg_constraint
        WHERE conrelid = $1::regclass AND contype IN ('p', 'u', 'c')
        ORDER BY contype, conname
    `, [regclass])

    const defs = [
        ...columns.map((c) => {
            const parts = [quoteIdent(c.name), c.type]
            if (c.default_expr) parts.push(`DEFAULT ${c.default_expr}`)
            if (c.not_null) parts.push('NOT NULL')
            return parts.join(' ')
        }),
        ...constraints.map((c) => `CONSTRAINT ${quoteIdent(c.conname)} ${c.def}`),
    ]

    await target.query(`CREATE TABLE ${quoteIdent(tableName)} (\n  ${defs.join(',\n  ')}\n)`)

    const { rows: indexes } = await source.query(`
        SELECT pg_get_indexdef(i.indexrelid) AS def
        FROM pg_index i
        JOIN pg_class t ON t.oid = i.indrelid
        JOIN pg_namespace ns ON ns.oid = t.relnamespace
        LEFT JOIN pg_constraint c ON c.conindid = i.indexrelid
        WHERE ns.nspname = 'public' AND t.relname = $1 AND c.oid IS NULL
    `, [tableName])

    for (const { def } of indexes) {
        await target.query(def)
    }
}

async function copyTableData (source, target, tableName) {
    const { rows: countRows } = await source.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdent(tableName)}`)
    const count = countRows[0]?.count || 0
    if (!count) return 0

    const { rows: columns } = await source.query(`
        SELECT a.attname AS name
        FROM pg_attribute a
        WHERE a.attrelid = $1::regclass AND a.attnum > 0 AND NOT a.attisdropped
        ORDER BY a.attnum
    `, [`"public".${quoteIdent(tableName)}`])

    const columnNames = columns.map(({ name }) => name)
    const quotedColumns = columnNames.map(quoteIdent).join(', ')
    const placeholders = columnNames.map((_, index) => `$${index + 1}`).join(', ')

    const { rows } = await source.query(`SELECT ${quotedColumns} FROM ${quoteIdent(tableName)}`)
    for (const row of rows) {
        const values = columnNames.map(name => row[name])
        await target.query(
            `INSERT INTO ${quoteIdent(tableName)} (${quotedColumns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values,
        )
    }

    return rows.length
}

/**
 * Drop Postgres FKs on main that reference tables routed to an external pool.
 * Those rows are written to the external DB, so main-side FK checks against an
 * empty/stale local copy would break dependent inserts (e.g. BillingReceiptFile → BillingReceipt).
 * Cross-source existence is validated by the adapter on INSERT/UPDATE; inbound on_delete
 * (PROTECT / CASCADE / SET_NULL) is enforced on DELETE / soft-delete.
 *
 * @param {import('pg').Client} client
 * @param {string[]} tableNames
 */
async function dropInboundForeignKeysOnMain (client, tableNames) {
    for (const tableName of tableNames) {
        if (!(await tableExists(client, tableName))) continue

        const { rows } = await client.query(`
            SELECT c.conname AS name, rel.relname AS from_table
            FROM pg_constraint c
            JOIN pg_class rel ON rel.oid = c.conrelid
            JOIN pg_namespace ns ON ns.oid = rel.relnamespace
            WHERE c.contype = 'f'
              AND ns.nspname = 'public'
              AND c.confrelid = $1::regclass
        `, [`"public".${quoteIdent(tableName)}`])

        for (const { name, from_table: fromTable } of rows) {
            await client.query(
                `ALTER TABLE ${quoteIdent(fromTable)} DROP CONSTRAINT ${quoteIdent(name)}`,
            )
            console.log(
                `[configure-external-db-storage] dropped FK ${fromTable}.${name} -> ${tableName}`,
            )
        }
    }
}

function buildRoutingRules () {
    const tableRules = EXTERNAL_POOLS.map(({ poolName, tables }) => ({
        tableName: `^(${tables.join('|')})$`,
        target: poolName,
    }))

    return [
        ...tableRules,
        { target: 'main', gqlOperationType: 'mutation' },
        { target: 'replicas', sqlOperationName: 'select' },
        { target: 'main' },
    ]
}

function buildDatabaseUrl (mainDb, poolUrls) {
    return `custom:${JSON.stringify({
        main: `${PG}/${mainDb}`,
        replica: `postgresql://postgres:postgres@127.0.0.1:5433/${mainDb}`,
        ...poolUrls,
    })}`
}

function buildDatabasePools () {
    const pools = {
        main: { databases: ['main'], writable: true },
        replicas: { databases: ['replica'], writable: false },
    }

    for (const { poolName } of EXTERNAL_POOLS) {
        pools[poolName] = { databases: [poolName], writable: true, kmigrator: false }
    }

    return pools
}

async function configureExternalDbStorage ({ envPath, writeEnv, copyData = false }) {
    const mainDb = readMainDbName(envPath)
    const mainUrl = `${PG}/${mainDb}`
    const poolUrls = {}

    console.log(`[configure-external-db-storage] main=${mainDb} copyData=${copyData}`)

    for (const { poolName, dbSuffix, tables } of EXTERNAL_POOLS) {
        const externalDb = `${mainDb}${dbSuffix}`
        const externalUrl = `${PG}/${externalDb}`
        poolUrls[poolName] = externalUrl

        console.log(`[configure-external-db-storage] pool=${poolName} db=${externalDb}`)

        await ensureDatabase(externalDb)

        await withClient(mainUrl, async (main) => {
            await withClient(externalUrl, async (external) => {
                for (const table of tables) {
                    if (!(await tableExists(main, table))) {
                        console.log(`[configure-external-db-storage] skip missing table on main: ${table}`)
                        continue
                    }

                    const existsOnExternal = await tableExists(external, table)
                    if (!existsOnExternal) {
                        await copyTableSchema(main, external, table)
                    }

                    if (copyData) {
                        const copied = await copyTableData(main, external, table)
                        console.log(`[configure-external-db-storage] copied ${copied} rows for ${table}`)
                    }
                }
            })

            // After schema/data copy: allow main-side dependents to reference external rows.
            await dropInboundForeignKeysOnMain(main, tables)
        })
    }

    await writeEnv({
        DATABASE_URL: buildDatabaseUrl(mainDb, poolUrls),
        DATABASE_POOLS: JSON.stringify(buildDatabasePools()),
        DATABASE_ROUTING_RULES: JSON.stringify(buildRoutingRules()),
        CROSS_DB_RELATION_PLANNER_ENABLED: 'true',
    })

    console.log('[configure-external-db-storage] done')
}

async function main () {
    const copyData = process.argv.includes('--copy-data')

    await configureExternalDbStorage({
        envPath: CONDO_ENV,
        copyData,
        writeEnv: (env) => prepareAppEnv('condo', env),
    })
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
