#!/usr/bin/env node

const nkeys = require('nkeys.js')

const akp = nkeys.createAccount()
const publicKey = akp.getPublicKey()
const seed = Buffer.from(akp.getSeed()).toString()

console.log(JSON.stringify({ seed, publicKey }))
