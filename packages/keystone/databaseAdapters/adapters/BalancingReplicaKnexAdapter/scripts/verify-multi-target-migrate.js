/**
 * Smoke test: __kmigratorKnexAdapters() runs knex migrations on every DATABASE_URL source.
 *
 * Usage (from repo root, Postgres on 127.0.0.1:5432):
 *   node packages/keystone/databaseAdapters/adapters/BalancingReplicaKnexAdapter/scripts/verify-multi-target-migrate.js
 */
const fs = require('fs')
const os = require('os')
const path = require('path')

const { BalancingReplicaKnexAdapter } = require('../adapter')

const MAIN_DB = 'cross_verify_main'
const EXT_DB = 'cross_verify_external'
const TABLE = '_kmigrator_multi_target_verify'
const BASE = 'postgresql://postgres:postgres@127.0.0.1:5432'

async function main () {
    const databaseUrl = `custom:${JSON.stringify({
        main: `${BASE}/${MAIN_DB}`,
        external: `${BASE}/${EXT_DB}`,
    })}`
    const replicaPools = JSON.stringify({
        main: { databases: ['main'], writable: true },
        external: { databases: ['external'], writable: true },
    })
    const routingRules = '[{"target":"main"}]'

    const adapter = new BalancingReplicaKnexAdapter({ databaseUrl, replicaPools, routingRules })
    adapter.listAdapters = {}
    adapter.getListAdapterByKey = () => null

    const migDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kmigrator-multi-verify-'))
    const migFile = path.join(migDir, '20260101000000_verify_multi_target.js')
    fs.writeFileSync(migFile, `
exports.up = async (knex) => {
    const exists = await knex.schema.hasTable('${TABLE}')
    if (!exists) {
        await knex.schema.createTable('${TABLE}', (t) => {
            t.uuid('id').primary()
            t.text('note')
        })
    }
}
exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('${TABLE}')
}
`)

    try {
        await adapter._connect()
        const stubs = adapter.__kmigratorKnexAdapters()
        console.log(`kmigrator stubs: ${stubs.length}`)

        for (let i = 0; i < stubs.length; i++) {
            const [batch, log] = await stubs[i].knex.migrate.latest({ directory: migDir })
            console.log(`stub[${i}] migrate.latest batch=${batch} log=${JSON.stringify(log)}`)
        }

        const clients = adapter._knexClients
        const dbNames = Object.keys(clients)
        let ok = true
        for (const dbName of dbNames) {
            const row = await clients[dbName].raw(
                `SELECT to_regclass('public.${TABLE}') AS regclass`
            )
            const regclass = row.rows?.[0]?.regclass ?? row[0]?.regclass
            const present = Boolean(regclass)
            console.log(`${dbName}: table ${TABLE} present=${present} (${regclass || 'missing'})`)
            if (!present) ok = false
        }

        if (!ok) {
            process.exitCode = 1
            console.error('FAIL: migration table not found on all databases')
            return
        }
        console.log('OK: migration applied on all DATABASE_URL sources')
    } finally {
        fs.rmSync(migDir, { recursive: true, force: true })
        await adapter.disconnect()
    }
}

main().catch((err) => {
    console.error(err)
    process.exitCode = 1
})
