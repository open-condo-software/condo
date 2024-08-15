const { HealthCheck, getPostgresHealthCheck, getRedisHealthCheck } = require('@open-condo/keystone/healthCheck')
const { StitchSchemaMiddleware } = require('@open-condo/keystone/stitchSchema')
const { CondoOIDCMiddleware } = require('@app/{{name}}/middlewares/oidc')
const { FeaturesMiddleware } = require('@open-condo/featureflags/FeaturesMiddleware')
const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')


const schemas = () => [
    require('@{{name}}/domains/user/schema'),
]

const apps = () => [
    new HealthCheck({ checks: [getPostgresHealthCheck(), getRedisHealthCheck()] }),
    new StitchSchemaMiddleware({ apiUrl: '/graphql' }),
    new CondoOIDCMiddleware(),
    new FeaturesMiddleware(),
]

const tasks = () => []

module.exports = prepareKeystone({
    schemas, apps, tasks,
})