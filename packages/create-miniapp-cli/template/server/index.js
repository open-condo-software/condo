const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const {
    HealthCheck,
    getRedisHealthCheck,
    getPostgresHealthCheck,
} = require('@open-condo/keystone/healthCheck')
const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')

const { CondoOIDCMiddleware } = require('./middlewares/oidc')

const apps = () => [
    FileAdapter.makeFileAdapterMiddleware(),
    new HealthCheck({ checks: [getPostgresHealthCheck(), getRedisHealthCheck()] }),
    new CondoOIDCMiddleware(),
]

const schemas = () => [
    require('~/domains/user/schema'),
]

const tasks = () => []

module.exports = prepareKeystone({
    apps, schemas, tasks,
})
