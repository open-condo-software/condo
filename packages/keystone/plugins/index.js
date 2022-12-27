const { uuided } = require('./uuided')
const { versioned } = require('./versioned')
const { tracked } = require('./tracked')
const { softDeleted } = require('./softDeleted')
const { historical } = require('./historical')
const { plugin, GQL_SCHEMA_PLUGIN } = require('./utils/typing')
const { dvAndSender } = require('./dvAndSender')

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
