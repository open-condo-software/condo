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

setup_and_start_services() {
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
