#!/bin/bash
# NOTE: CI USAGE ONLY!
set -ex

domain_name=""
shard_index=""
shard_total=""

usage() {
    echo "Usage: $0 -d <domain_name> | -s <shard_index> -t <shard_total>"
    exit 1
}

configure_message_db_storage() {
    local main_db
    main_db=$(node <<'NODE'
const fs = require('fs')

const envFile = fs.readFileSync('./apps/condo/.env', 'utf8')
const databaseUrlLine = envFile.split(/\r?\n/).find(line => line.startsWith('DATABASE_URL='))
if (!databaseUrlLine) {
    throw new Error('DATABASE_URL is missing in apps/condo/.env')
}

const databaseUrl = databaseUrlLine.slice('DATABASE_URL='.length)
const parsedUrl = databaseUrl.startsWith('custom:')
    ? JSON.parse(databaseUrl.slice('custom:'.length)).main
    : databaseUrl

process.stdout.write(new URL(parsedUrl).pathname.replace(/^\//, ''))
NODE
)

    local message_db="${main_db}_message"
    local postgres_admin_url="postgresql://postgres:postgres@127.0.0.1:5432/postgres"
    local main_db_url="postgresql://postgres:postgres@127.0.0.1:5432/${main_db}"
    local message_db_url="postgresql://postgres:postgres@127.0.0.1:5432/${message_db}"
    local message_tables='["Message","MessageHistoryRecord"]'

    POSTGRES_ADMIN_URL="$postgres_admin_url" MAIN_DB_URL="$main_db_url" MESSAGE_DB_URL="$message_db_url" MESSAGE_TABLES="$message_tables" node <<'NODE'
const { Client } = require('pg')

function quoteIdent (value) {
    return `"${String(value).replace(/"/g, '""')}"`
}

async function withClient (connectionString, callback) {
    const client = new Client({ connectionString })
    await client.connect()
    try {
        return await callback(client)
    } finally {
        await client.end()
    }
}

async function recreateDatabase (adminClient, dbName) {
    await adminClient.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()
    `, [dbName])
    await adminClient.query(`DROP DATABASE IF EXISTS ${quoteIdent(dbName)}`)
    await adminClient.query(`CREATE DATABASE ${quoteIdent(dbName)}`)
}

async function cloneTableSchema ({ sourceClient, targetClient, tableName }) {
    const qualifiedTableName = `"public".${quoteIdent(tableName)}`
    const { rows: columnRows } = await sourceClient.query(`
        SELECT
            a.attname AS column_name,
            pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
            a.attnotnull AS not_null,
            pg_get_expr(ad.adbin, ad.adrelid) AS default_expr
        FROM pg_attribute a
        LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
        WHERE a.attrelid = $1::regclass
          AND a.attnum > 0
          AND NOT a.attisdropped
        ORDER BY a.attnum
    `, [qualifiedTableName])

    const { rows: constraintRows } = await sourceClient.query(`
        SELECT conname, contype, pg_get_constraintdef(oid, true) AS definition
        FROM pg_constraint
        WHERE conrelid = $1::regclass
          AND contype IN ('p', 'u', 'c')
        ORDER BY contype, conname
    `, [qualifiedTableName])

    const columnDefinitions = columnRows.map((column) => {
        const parts = [quoteIdent(column.column_name), column.data_type]
        if (column.default_expr) parts.push(`DEFAULT ${column.default_expr}`)
        if (column.not_null) parts.push('NOT NULL')
        return parts.join(' ')
    })

    const constraintDefinitions = constraintRows.map((constraint) => {
        return `CONSTRAINT ${quoteIdent(constraint.conname)} ${constraint.definition}`
    })

    const createTableSql = `
        CREATE TABLE ${quoteIdent(tableName)} (
            ${[...columnDefinitions, ...constraintDefinitions].join(',\n            ')}
        )
    `
    await targetClient.query(createTableSql)

    const { rows: indexRows } = await sourceClient.query(`
        SELECT pg_get_indexdef(i.indexrelid) AS indexdef
        FROM pg_index i
        JOIN pg_class t ON t.oid = i.indrelid
        JOIN pg_namespace ns ON ns.oid = t.relnamespace
        LEFT JOIN pg_constraint c ON c.conindid = i.indexrelid
        WHERE ns.nspname = 'public'
          AND t.relname = $1
          AND c.oid IS NULL
    `, [tableName])

    for (const { indexdef } of indexRows) {
        await targetClient.query(indexdef)
    }
}

async function dropSourceTables (sourceClient, tableNames) {
    for (const tableName of tableNames) {
        await sourceClient.query(`DROP TABLE IF EXISTS ${quoteIdent(tableName)} CASCADE`)
    }
}

async function main () {
    const adminUrl = process.env.POSTGRES_ADMIN_URL
    const mainDbUrl = process.env.MAIN_DB_URL
    const messageDbUrl = process.env.MESSAGE_DB_URL
    const tableNames = JSON.parse(process.env.MESSAGE_TABLES)
    const messageDbName = new URL(messageDbUrl).pathname.replace(/^\//, '')

    await withClient(adminUrl, async (adminClient) => {
        await recreateDatabase(adminClient, messageDbName)
    })

    await withClient(mainDbUrl, async (sourceClient) => {
        await withClient(messageDbUrl, async (targetClient) => {
            for (const tableName of tableNames) {
                await cloneTableSchema({ sourceClient, targetClient, tableName })
            }
        })

        await dropSourceTables(sourceClient, [...tableNames].reverse())
    })
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
NODE

    MAIN_DB_NAME="$main_db" MESSAGE_DB_NAME="$message_db" MESSAGE_TABLES="$message_tables" node <<'NODE'
const { prepareAppEnv } = require('./packages/cli')

async function main () {
    const { MAIN_DB_NAME, MESSAGE_DB_NAME } = process.env
    const messageTables = JSON.parse(process.env.MESSAGE_TABLES)
    const messageTableRegex = `^(${messageTables.join('|')})$`

    await prepareAppEnv('condo', {
        DATABASE_URL: `custom:${JSON.stringify({
            main: `postgresql://postgres:postgres@127.0.0.1:5432/${MAIN_DB_NAME}`,
            replica: `postgresql://postgres:postgres@127.0.0.1:5433/${MAIN_DB_NAME}`,
            message: `postgresql://postgres:postgres@127.0.0.1:5432/${MESSAGE_DB_NAME}`,
        })}`,
        DATABASE_POOLS: JSON.stringify({
            main: { databases: ['main'], writable: true },
            message: { databases: ['message'], writable: true },
            replicas: { databases: ['replica'], writable: false },
        }),
        DATABASE_ROUTING_RULES: JSON.stringify([
            { tableName: messageTableRegex, target: 'message' },
            { target: 'main', gqlOperationType: 'mutation' },
            { target: 'replicas', sqlOperationName: 'select' },
            { target: 'main' },
        ]),
    })
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
NODE
}

setup_and_start_services() {
    node bin/prepare.js -f condo -c condo
    configure_message_db_storage

    export NEWS_ITEMS_SENDING_DELAY_SEC=2
    export NEWS_ITEM_SENDING_TTL_SEC=2
    export NODE_OPTIONS="--max_old_space_size=4192"
    export WORKER_CONCURRENCY=100
    export DATABASE_POOL_MAX=10

    node -e 'console.log(v8.getHeapStatistics().heap_size_limit/(1024*1024))'

    # NOTE(pahaz): Keystone not in dev mode trying to check dist/admin folder
    mkdir -p ./apps/condo/dist/admin

    yarn workspace @app/condo start 2>&1 > /app/test_logs/condo.dev.log &

    node bin/wait-apps-apis.js -f condo

    # NOTE: the test bootstrap moves Message tables into a dedicated DB after the
    # normal single-DB migrate completes. `makemigrations --check` compares the
    # current runtime layout with the canonical migration graph, so it becomes an
    # invalid signal for this synthetic cross-db setup.

    source bin/validate-db-schema-ts-to-match-graphql-api.sh

    yarn workspace @app/condo worker 2>&1 > /app/test_logs/condo.worker.log &
    sleep 3

    # And check background processes!
    [[ $(jobs | wc -l | tr -d ' ') != '2' ]] && exit 2
    sleep 3
}

stop_services() {
    # Note: we need to stop background worker! because packages tests use the same redis queue
    kill $(jobs -p) || echo 'background worker and dev server is already killed!'
    killall node || echo 'no node processes'
}

while getopts ":d:s:t:" opt; do
    case $opt in
        d)
            domain_name="$OPTARG"
            ;;
        s)
            shard_index="$OPTARG"
            ;;
        t)
            shard_total="$OPTARG"
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            usage
            ;;
        :)
            echo "Option -$OPTARG required argument." >&2
            usage
            ;;
    esac
done

if [ -n "$domain_name" ] && { [ -n "$shard_index" ] || [ -n "$shard_total" ]; }; then
    echo "Use either legacy domain mode (-d) or shard mode (-s/-t), not both"
    usage
fi

if [ -n "$domain_name" ]; then
    setup_and_start_services

    if [ "$domain_name" != 'others' ]; then
        # TESTS
        yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=3 --forceExit --silent=false --verbose --bail --testPathPattern '/domains/'$domain_name'/schema/(.*)[.]test.js$' 2>&1 > '/app/test_logs/condo.'$domain_name'.tests.log'
        # SPECS
        if [ -n "$(find apps/condo/domains/$domain_name -name '*spec.[j|t]s' 2>/dev/null)" ]; then
            yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=2 --forceExit --silent=false --verbose --bail --testPathPattern '/domains/'$domain_name'/(.*)[.]spec.[j|t]s$' 2>&1 > '/app/test_logs/condo.'$domain_name'.specs.log'
        else
            echo "Files matching (.*)[.]spec.[j|t]s in directory apps/condo/domains/$domain_name not found! Skipping..."
        fi
    else
        # TESTS
        yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=3 --forceExit --silent=false --verbose --bail --testPathPattern '/schema/(.*)[.]test.js$' --testPathIgnorePatterns='/domains/(organization|user|scope|property|acquiring|billing|miniapp|banking|ticket|meter|contact|resident|notification|common)/' 2>&1 > /app/test_logs/condo.others.tests.log
        yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=3 --forceExit --silent=false --verbose --bail --testPathPattern '(.*)[.]test.js$' --testPathIgnorePatterns='/schema/(.*)[.]test.js$' 2>&1 > /app/test_logs/condo.5.test.others.log
        # SPECS
        yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=2 --forceExit --silent=false --verbose --bail --testPathPattern '(.*)[.]spec.[j|t]s$' --testPathIgnorePatterns='/domains/(organization|user|scope|property|acquiring|billing|miniapp|banking|ticket|meter|contact|resident|notification|common)/' 2>&1 > /app/test_logs/condo.others.specs.log
    fi

    stop_services

    if [ "$domain_name" = 'others' ]; then
        # TODO: INFRA-155 Remove it completely by rewriting a task tests or migrate to jest.setup or smth
        REDIS_URL='[{"port":7001,"host":"127.0.0.1"},{"port":7002,"host":"127.0.0.1"},{"port":7003,"host":"127.0.0.1"}]' yarn workspace @open-condo/keystone test
        yarn workspace @app/condo lint-schema
    fi

    exit 0
fi

if [ -z "$shard_index" ] || [ -z "$shard_total" ]; then
    echo "-s and -t are required arguments!"
    usage
fi

if ! [[ "$shard_index" =~ ^[0-9]+$ ]] || ! [[ "$shard_total" =~ ^[0-9]+$ ]]; then
    echo "-s and -t must be positive numbers"
    exit 1
fi

if [ "$shard_index" -lt 1 ] || [ "$shard_total" -lt 1 ] || [ "$shard_index" -gt "$shard_total" ]; then
    echo "Invalid shard values: shard_index=$shard_index shard_total=$shard_total"
    exit 1
fi

setup_and_start_services

# TESTS (.test.js)
yarn workspace @app/condo test \
    --workerIdleMemoryLimit="256MB" \
    --testTimeout=15000 \
    -w=3 \
    --forceExit \
    --silent=false \
    --verbose \
    --bail \
    --testPathPattern '(.*)[.]test.js$' \
    --shard="$shard_index/$shard_total" \
    2>&1 > "/app/test_logs/condo.shard-${shard_index}-of-${shard_total}.tests.log"

# SPECS (.spec.js|.spec.ts)
yarn workspace @app/condo test \
    --workerIdleMemoryLimit="256MB" \
    --testTimeout=15000 \
    -w=2 \
    --forceExit \
    --silent=false \
    --verbose \
    --bail \
    --testPathPattern '(.*)[.]spec.[j|t]s$' \
    --shard="$shard_index/$shard_total" \
    2>&1 > "/app/test_logs/condo.shard-${shard_index}-of-${shard_total}.specs.log"

stop_services

# Run non-domain tests that were previously executed in "others"
if [ "$shard_index" -eq 1 ]; then
    # TODO: INFRA-155 Remove it completely by rewriting a task tests or migrate to jest.setup or smth
    REDIS_URL='[{"port":7001,"host":"127.0.0.1"},{"port":7002,"host":"127.0.0.1"},{"port":7003,"host":"127.0.0.1"}]' yarn workspace @open-condo/keystone test
    yarn workspace @app/condo lint-schema
fi
