const adapters = require('./adapters')
const crossDb = require('./crossDb')
const dataProviders = require('./dataProviders')

module.exports = {
    ...adapters,
    ...dataProviders,
    ...crossDb,
}
