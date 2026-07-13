#!/usr/bin/env node
/**
 * CI-only: enable cross-database Message routing for condo tests.
 *
 * Runs after `bin/prepare.js` (single-DB migrate). CI Postgres is fresh, so the
 * message database does not exist yet — we only CREATE it and copy table DDL.
 *
 * Steps:
 *   1. CREATE DATABASE <main>_message (skip if already present)
 *   2. Copy Message + MessageHistoryRecord schema from main → message DB
 *   3. Rewrite apps/condo/.env (DATABASE_URL / POOLS / ROUTING_RULES)
 *
 * Message tables stay on main too; routing rules send Message queries to the message pool.
 */

const fs = require('fs')
const { Client } = require('pg')

const { prepareAppEnv } = require('../packages/cli')

const CONDO_ENV = './apps/condo/.env'
const MESSAGE_TABLES = ['Message', 'MessageHistoryRecord']
const PG = 'postgresql://postgres:postgres@127.0.0.1:5432'
const ADMIN_URL = `${PG}/postgres`

function quoteIdent (name) {
    return `"${String(name).replace(/"/g, '""')}"`
}

function readMainDbName () {
    const line = fs.readFileSync(CONDO_ENV, 'utf8').split(/\r?\n/).find(l => l.startsWith('DATABASE_URL='))
    if (!line) throw new Error(`DATABASE_URL missing in ${CONDO_ENV}`)

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

async function main () {
    const mainDb = readMainDbName()
    const messageDb = `${mainDb}_message`
    const mainUrl = `${PG}/${mainDb}`
    const messageUrl = `${PG}/${messageDb}`

    console.log(`[configure-message-db-storage] main=${mainDb} message=${messageDb}`)

    await ensureDatabase(messageDb)

    await withClient(mainUrl, async (main) => {
        await withClient(messageUrl, async (message) => {
            for (const table of MESSAGE_TABLES) {
                await copyTableSchema(main, message, table)
            }
        })
    })

    const messageRegex = `^(${MESSAGE_TABLES.join('|')})$`
    await prepareAppEnv('condo', {
        DATABASE_URL: `custom:${JSON.stringify({
            main: mainUrl,
            replica: `postgresql://postgres:postgres@127.0.0.1:5433/${mainDb}`,
            message: messageUrl,
        })}`,
        DATABASE_POOLS: JSON.stringify({
            main: { databases: ['main'], writable: true },
            message: { databases: ['message'], writable: true },
            replicas: { databases: ['replica'], writable: false },
        }),
        DATABASE_ROUTING_RULES: JSON.stringify([
            { tableName: messageRegex, target: 'message' },
            { target: 'main', gqlOperationType: 'mutation' },
            { target: 'replicas', sqlOperationName: 'select' },
            { target: 'main' },
        ]),
    })

    console.log('[configure-message-db-storage] done')
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
