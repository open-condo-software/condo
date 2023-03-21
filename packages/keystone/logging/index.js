const { getKeystonePinoOptions } = require('./getKeystonePinoOptions')
const { getLogger } = require('./getLogger')
const { GraphQLLoggerPlugin } = require('./GraphQLLoggerApp')

module.exports = {
    getLogger,
    getKeystonePinoOptions,
    GraphQLLoggerPlugin,
}
