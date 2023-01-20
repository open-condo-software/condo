const { dvAndSender } = require('./dvAndSender')
const { historical } = require('./historical')
const { softDeleted } = require('./softDeleted')
const { tracked } = require('./tracked')
const { plugin, GQL_SCHEMA_PLUGIN } = require('./utils/typing')
const { uuided } = require('./uuided')
const { versioned } = require('./versioned')

module.exports = {
    uuided,
    versioned,
    tracked,
    softDeleted,
    historical,
    dvAndSender,
    plugin,
    GQL_SCHEMA_PLUGIN,
}
