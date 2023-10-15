#!/usr/bin/env bash

set -e

API_SLEEP_INTERVAL=3
API_WAIT_TIMEOUT=120
API_RESULT=$(curl -s 'http://localhost:3000/admin/api' --data-raw '{"operationName":null,"variables":{},"query":"{appVersion}"}' -H 'content-type: application/json' | tr -d ' \n')
# API_RESULT is empty if server is down!
while [[ ("${API_RESULT}" != *"appVersion"* || "${API_RESULT}" == "") && ((${API_WAIT_TIMEOUT} > 0)) ]]; do
  sleep ${API_SLEEP_INTERVAL}
  API_RESULT=$(curl -s 'http://localhost:3000/admin/api' --data-raw '{"operationName":null,"variables":{},"query":"{appVersion}"}' -H 'content-type: application/json' | tr -d ' \n')
  ((API_WAIT_TIMEOUT-=${API_SLEEP_INTERVAL}))
done
