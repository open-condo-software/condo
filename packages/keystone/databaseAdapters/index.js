const adapters = require('./adapters')
const sourceRegistry = require('./sourceRegistry')

module.exports = {
    ...adapters,
    ...sourceRegistry,
}
