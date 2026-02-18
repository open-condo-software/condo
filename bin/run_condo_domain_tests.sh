#!/bin/bash
# NOTE: CI USAGE ONLY!
set -ex

shard_index=""
shard_total=""

usage() {
    echo "Usage: $0 -s <shard_index> -t <shard_total>"
    exit 1
}

while getopts "s:t:" opt; do
    case $opt in
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

node bin/prepare.js -f condo -r condo -c condo

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

# check migrations
yarn workspace @app/condo makemigrations --check &> /dev/null

source bin/validate-db-schema-ts-to-match-graphql-api.sh

yarn workspace @app/condo worker 2>&1 > /app/test_logs/condo.worker.log &
sleep 3

# And check background processes!
[[ $(jobs | wc -l | tr -d ' ') != '2' ]] && exit 2
sleep 3

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

# Note: we need to stop background worker! because packages tests use the same redis queue
kill $(jobs -p) || echo 'background worker and dev server is already killed!'
killall node || echo 'no node processes'

# Run non-domain tests that were previously executed in "others"
if [ "$shard_index" -eq 1 ]; then
    # TODO: INFRA-155 Remove it completely by rewriting a task tests or migrate to jest.setup or smth
    REDIS_URL='[{"port":7001,"host":"127.0.0.1"},{"port":7002,"host":"127.0.0.1"},{"port":7003,"host":"127.0.0.1"}]' yarn workspace @open-condo/keystone test
    yarn workspace @app/condo lint-schema
fi
