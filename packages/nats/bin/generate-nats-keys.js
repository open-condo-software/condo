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

console.log(JSON.stringify({ seed, publicKey }))
