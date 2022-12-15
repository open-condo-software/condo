const { uuided } = require('./uuided')
const { versioned } = require('./versioned')
const { tracked } = require('./tracked')
const { softDeleted } = require('./softDeleted')
const { historical } = require('./historical')
const { plugin, GQL_SCHEMA_PLUGIN } = require('./utils/typing')
const { dvAndSender } = require('./dvAndSender')
const { searchBy } = require('./searchBy')
const { searchUpdateByTrigger } = require('./searchUpdateByTrigger')

module.exports = {
    uuided,
    versioned,
    tracked,
    softDeleted,
    historical,
    dvAndSender,
    searchBy,
    searchUpdateByTrigger,
    plugin,
    GQL_SCHEMA_PLUGIN,
}
