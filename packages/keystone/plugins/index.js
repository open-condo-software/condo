const { analytical } = require('./analytical')
const { dvAndSender } = require('./dvAndSender')
const { historical } = require('./historical')
const { importable } = require('./importable')
const { softDeleted } = require('./softDeleted')
const { tracked } = require('./tracked')
const { plugin, GQL_SCHEMA_PLUGIN } = require('./utils/typing')
const { uuided } = require('./uuided')
const { versioned } = require('./versioned')

module.exports = {
    analytical,
    uuided,
    versioned,
    tracked,
    softDeleted,
    historical,
    dvAndSender,
    plugin,
    importable,
    GQL_SCHEMA_PLUGIN,
}
