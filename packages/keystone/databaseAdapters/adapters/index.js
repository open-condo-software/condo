const { BalancingReplicaKnexAdapter } = require('./BalancingReplicaKnexAdapter')
const { BalancingReplicaPrismaAdapter } = require('./BalancingReplicaPrismaAdapter')
const { FakeDatabaseAdapter } = require('./FakeDatabaseAdapter')
const { KnexAdapter } = require('./KnexAdapter')
const { PrismaAdapter } = require('./PrismaAdapter')

module.exports = {
    FakeDatabaseAdapter,
    BalancingReplicaKnexAdapter,
    BalancingReplicaPrismaAdapter,
    KnexAdapter,
    PrismaAdapter,
}
