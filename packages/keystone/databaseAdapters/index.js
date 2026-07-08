const adapters = require('./adapters')
const crossDb = require('./crossDb')
const dataProviders = require('./dataProviders')
const sourceRegistry = require('./sourceRegistry')

module.exports = {
    ...adapters,
    ...sourceRegistry,
    ...dataProviders,
    ...crossDb,
}
