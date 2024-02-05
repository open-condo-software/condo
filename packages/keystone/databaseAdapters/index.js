const { FakeDatabaseAdapter } = require('./FakeDatabaseAdapter')
const { ScalableDatabaseAdapter } = require('./ScalableDatabaseAdapter')
const { wrapToCheckOnlyPublicApi } = require('./wrapToCheckOnlyPublicApi')

module.exports = { ScalableDatabaseAdapter, FakeDatabaseAdapter, wrapToCheckOnlyPublicApi }
