const { uuided } = require('./uuided')
const { versioned } = require('./versioned')
const { tracked } = require('./tracked')
const { softDeleted } = require('./softDeleted')
const { historical } = require('./historical')
const { plugin, GQL_SCHEMA_PLUGIN } = require('./utils/typing')

module.exports = {
    uuided,
    versioned,
    tracked,
    softDeleted,
    historical,
    plugin,
    GQL_SCHEMA_PLUGIN,
}
