const { FakeDatabaseAdapter } = require('./FakeDatabaseAdapter')
const { KnexAdapter } = require('./KnexAdapter')
const { ScalableDatabaseAdapter } = require('./ScalableDatabaseAdapter')
const { wrapToCheckOnlyPublicApi } = require('./wrapToCheckOnlyPublicApi')

module.exports = { ScalableDatabaseAdapter, KnexAdapter, FakeDatabaseAdapter, wrapToCheckOnlyPublicApi }
