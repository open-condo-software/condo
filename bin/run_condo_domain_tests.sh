#!/bin/bash
# NOTE: CI USAGE ONLY!
set -ex

domain_name=""

usage() {
    echo "Usage: $0 -d <domain_name>"
    exit 1
}

while getopts "d:" opt; do
    case $opt in
        d)
            domain_name="$OPTARG"
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

if [ -z "$domain_name" ]; then
    echo "-d is a required argument!"
    usage
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

if [ $domain_name != "others" ]; then
    # TESTS
    yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=3 --forceExit --silent=false --verbose --bail --testPathPattern '/domains/'$domain_name'/schema/(.*)[.]test.js$' 2>&1 > '/app/test_logs/condo.'$domain_name'.tests.log'
    # SPECS
    if [ -n "$(find apps/condo/domains/$domain_name -name '*spec.[j|t]s' 2>/dev/null)" ]; then
        yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=2 --forceExit --silent=false --verbose --bail --testPathPattern '/domains/'$domain_name'/(.*)[.]spec.[j|t]s$' 2>&1 > '/app/test_logs/condo.'$domain_name'.specs.log'
    else
        echo "Files matching (.*)[.]spec.[j|t]s in directory apps/condo/domains/$domain_name not found! Skipping..."
    fi
    # Note: we need to stop background worker! because packages tests use the same redis queue
    kill $(jobs -p) || echo 'background worker and dev server is already killed!'
    killall node || echo 'no node processes'
else
    # TESTS
    yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=3 --forceExit --silent=false --verbose --bail --testPathPattern '/schema/(.*)[.]test.js$' --testPathIgnorePatterns='/domains/(organization|user|scope|property|acquiring|billing|miniapp|banking|ticket|meter|contact|resident|notification|common)/' 2>&1 > /app/test_logs/condo.others.tests.log
    yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=3 --forceExit --silent=false --verbose --bail --testPathPattern '(.*)[.]test.js$' --testPathIgnorePatterns='/schema/(.*)[.]test.js$' 2>&1 > /app/test_logs/condo.5.test.others.log
    # SPECS
    yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=2 --forceExit --silent=false --verbose --bail --testPathPattern '(.*)[.]spec.[j|t]s$' --testPathIgnorePatterns='/domains/(organization|user|scope|property|acquiring|billing|miniapp|banking|ticket|meter|contact|resident|notification|common)/' 2>&1 > /app/test_logs/condo.others.specs.log
    # Note: we need to stop background worker! because packages tests use the same redis queue
    kill $(jobs -p) || echo 'background worker and dev server is already killed!'
    killall node || echo 'no node processes'

    # TODO: INFRA-155 Remove it completely by rewriting a task tests or migrate to jest.setup or smth
    REDIS_URL='[{"port":7001,"host":"127.0.0.1"},{"port":7002,"host":"127.0.0.1"},{"port":7003,"host":"127.0.0.1"}]' yarn workspace @open-condo/keystone test
    yarn workspace @app/condo lint-schema
fi
