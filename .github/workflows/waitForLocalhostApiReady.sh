#!/usr/bin/env bash

set -xe

API_SLEEP_INTERVAL=3
API_WAIT_TIMEOUT=120
API_RESULT=$(curl -s 'http://localhost:3000/admin/api' --data-raw '{"operationName":null,"variables":{},"query":"{appVersion}"}' -H 'content-type: application/json' | tr -d ' \n')
# API_RESULT is empty if server is down!
while [[ "${API_RESULT}" != *"appVersion"* && "${API_RESULT}" != "" && ((${API_WAIT_TIMEOUT} > 0)) ]]; do
  sleep ${API_SLEEP_INTERVAL}
  API_RESULT=$(curl -s 'http://localhost:3000/admin/api' --data-raw '{"operationName":null,"variables":{},"query":"{appVersion}"}' -H 'content-type: application/json' | tr -d ' \n')
  ((API_WAIT_TIMEOUT-=${API_SLEEP_INTERVAL}))
done

AUTH_USERNAME=admin@example.com
AUTH_PASSWORD=3a74b3f07978
API_AUTH_RESULT=$(curl -s 'http://localhost:3000/admin/api' --data-raw '{"operationName":"signin","variables":{"identity":"'${AUTH_USERNAME}'","secret":"'${AUTH_PASSWORD}'"},"query":"mutation signin($identity: String, $secret: String) { authenticate: authenticateUserWithPassword(email: $identity, password: $secret) { item {   id   __typename } __typename } } "}' -H 'content-type: application/json'  | tr -d ' \n')
while [[ "${API_AUTH_RESULT}" != *'"__typename":"User"'* && ((${API_WAIT_TIMEOUT} > 0)) ]]; do
  sleep ${API_SLEEP_INTERVAL}
  API_AUTH_RESULT=$(curl -s 'http://localhost:3000/admin/api' --data-raw '{"operationName":"signin","variables":{"identity":"'${AUTH_USERNAME}'","secret":"'${AUTH_PASSWORD}'"},"query":"mutation signin($identity: String, $secret: String) { authenticate: authenticateUserWithPassword(email: $identity, password: $secret) { item {   id   __typename } __typename } } "}' -H 'content-type: application/json'  | tr -d ' \n')
  ((API_WAIT_TIMEOUT-=${API_SLEEP_INTERVAL}))
done

echo ${API_AUTH_RESULT}
