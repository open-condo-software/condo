const { AsyncLocalStorage } = require('node:async_hooks')

const asyncLocalStorage = new AsyncLocalStorage()

module.exports = { asyncLocalStorage }