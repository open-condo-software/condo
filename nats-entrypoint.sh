#!/bin/sh
set -e

extract() { echo "$MESSAGING_CONFIG" | sed -n "s/.*\"$1\":\"\([^\"]*\)\".*/\1/p"; }

export MESSAGING_AUTH_ISSUER=$(extract authIssuer)
export MESSAGING_AUTH_USER=$(extract authUser)
export MESSAGING_AUTH_PASSWORD=$(extract authPassword)
export MESSAGING_SERVER_USER=$(extract serverUser)
export MESSAGING_SERVER_PASSWORD=$(extract serverPassword)

exec nats-server "$@"
