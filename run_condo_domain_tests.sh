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

cp .env.example .env
# TODO: Remove all this evn below after migrating to new CI
echo 'CALLCENTER_DOMAIN=http://localhost:3001' >> .env

export NODE_ENV=test
export DISABLE_LOGGING=false
export NOTIFICATION__SEND_ALL_MESSAGES_TO_CONSOLE=true
export NOTIFICATION__DISABLE_LOGGING=true
export TESTS_LOG_REQUEST_RESPONSE=true
export WORKER_CONCURRENCY=50
export NODE_OPTIONS="--max_old_space_size=4192"
export METABASE_CONFIG='{"url": "https://metabase.example.com", "secret": "4879960c-a625-4096-9add-7a81d925774a"}'
export NEWS_ITEMS_SENDING_DELAY_SEC=2

node -e 'console.log(v8.getHeapStatistics().heap_size_limit/(1024*1024))'

# NOTE(pahaz): Keystone not in dev mode trying to check dist/admin folder
mkdir -p ./apps/condo/dist/admin

[[ $DATABASE_URL == postgresql* ]] && yarn workspace @app/condo migrate

yarn workspace @app/condo dev 2>&1 > condo.dev.log &

# waitForLocalhostApiReady.sh
API_SLEEP_INTERVAL=3
API_WAIT_TIMEOUT=120
API_RESULT=$(curl -s 'http://localhost:3000/admin/api' --data-raw '{"operationName":null,"variables":{},"query":"{appVersion}"}' -H 'content-type: application/json' | tr -d ' \n')
# API_RESULT is empty if server is down!
while [[ ("${API_RESULT}" != *"appVersion"* || "${API_RESULT}" == "") && ((${API_WAIT_TIMEOUT} > 0)) ]]; do
  sleep ${API_SLEEP_INTERVAL}
  API_RESULT=$(curl -s 'http://localhost:3000/admin/api' --data-raw '{"operationName":null,"variables":{},"query":"{appVersion}"}' -H 'content-type: application/json' | tr -d ' \n')
  ((API_WAIT_TIMEOUT-=${API_SLEEP_INTERVAL}))
done

# check migrations
yarn workspace @app/condo makemigrations --check &> /dev/null

source bin/validate-db-schema-ts-to-match-graphql-api.sh

yarn workspace @app/condo worker 2>&1 > condo.worker.log &
sleep 3
yarn workspace @app/condo worker 2>&1 > condo.worker1.log &
sleep 3


# And check background processes!
[[ $(jobs | wc -l | tr -d ' ') != '3' ]] && exit 2
sleep 3

if [ $domain_name != "others" ]; then
    # TESTS
    yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=3 --forceExit --silent=false --verbose --bail --testPathPattern '/domains/'$domain_name'/schema/(.*)[.]test.js$' 2>&1 > 'condo.'$domain_name'.tests.log'
    # SPECS
    if [ -n "$(find apps/condo/domains/$domain_name -name '*spec.js' 2>/dev/null)" ]; then
        yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=3 --forceExit --silent=false --verbose --bail --testPathPattern '/domains/'$domain_name'/(.*)[.]spec.js$' 2>&1 > 'condo.'$domain_name'.specs.log'
    else
        echo "Files matching (.*)[.]spec.js in directory apps/condo/domains/$domain_name not found! Skipping..."
    fi
    # Note: we need to stop background worker! because packages tests use the same redis queue
    kill $(jobs -p) || echo 'background worker and dev server is already killed!'
    killall node || echo 'no node processes'
else
    # TESTS
    yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=3 --forceExit --silent=false --verbose --bail --testPathPattern '/schema/(.*)[.]test.js$' --testPathIgnorePatterns='/domains/(organization|user|scope|property|acquiring|billing|miniapp|banking|ticket|meter|contact|resident|notification|common)/' 2>&1 > condo.others.tests.log
    yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=3 --forceExit --silent=false --verbose --bail --testPathPattern '(.*)[.]test.js$' --testPathIgnorePatterns='/schema/(.*)[.]test.js$' 2>&1 > condo.5.test.others.log
    # SPECS
    yarn workspace @app/condo test --workerIdleMemoryLimit="256MB" --testTimeout=15000 -w=3 --forceExit --silent=false --verbose --bail --testPathPattern '(.*)[.]spec.js$' --testPathIgnorePatterns='/domains/(organization|user|scope|property|acquiring|billing|miniapp|banking|ticket|meter|contact|resident|notification|common)/' 2>&1 > condo.others.specs.log
    # Note: we need to stop background worker! because packages tests use the same redis queue
    kill $(jobs -p) || echo 'background worker and dev server is already killed!'
    killall node || echo 'no node processes'

    yarn jest ./packages/keystone --maxWorkers=2
    yarn workspace @app/condo lint-schema
fi
