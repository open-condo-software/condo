#!/usr/bin/env node

/**
 * Generates NKey pair for NATS auth callout configuration.
 *
 * Usage:
 *   node packages/nats/bin/generate-nats-keys.js        # human-readable output
 *   node packages/nats/bin/generate-nats-keys.js --json  # JSON output for scripts
 *
 * The output provides:
 * - NATS_AUTH_ISSUER: public key to set in nats.conf (or as env var for NATS container)
 * - NATS_AUTH_ACCOUNT_SEED: secret seed to set in .env (used by auth callout service)
 */

const nkeys = require('nkeys.js')

const akp = nkeys.createAccount()
const publicKey = akp.getPublicKey()
const seed = Buffer.from(akp.getSeed()).toString()

if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ seed, publicKey }))
} else {
    console.log('=== NATS Auth Callout NKey Pair ===\n')
    console.log('Add to your .env file:')
    console.log(`NATS_AUTH_ACCOUNT_SEED=${seed}`)
    console.log(`NATS_AUTH_ISSUER=${publicKey}`)
    console.log('NATS_AUTH_PASSWORD=auth-secret')
    console.log('NATS_AUTH_USER=auth-service')
    console.log('NATS_SERVER_PASSWORD=server-secret')
    console.log('NATS_SERVER_USER=condo-server')
    console.log('')
    console.log('Pass NATS_AUTH_ISSUER and passwords to the NATS container (docker-compose env).')
    console.log('The seed (NATS_AUTH_ACCOUNT_SEED) must NEVER be shared with the NATS server.')
}
