const { BalancingReplicaKnexAdapter } = require('./BalancingReplicaKnexAdapter')
const { FakeDatabaseAdapter } = require('./FakeDatabaseAdapter')

module.exports = {
    FakeDatabaseAdapter,
    BalancingReplicaKnexAdapter,
}
