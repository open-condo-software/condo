const { CondoOIDCMiddleware } = require('@app/announcement/middlewares/oidc')
const { NextApp } = require('@keystonejs/app-next')

const conf = require('@open-condo/config')
const { FeaturesMiddleware } = require('@open-condo/featureflags/FeaturesMiddleware')
const { HealthCheck, getPostgresHealthCheck, getRedisHealthCheck } = require('@open-condo/keystone/healthCheck')
const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')
const { StitchSchemaMiddleware } = require('@open-condo/keystone/stitchSchema')

const FileAdapter = require('@condo/domains/common/utils/fileAdapter')


const lastApp = conf.NODE_ENV === 'test' ? undefined : new NextApp({ dir: '.' })

const schemas = () => [
    require('@announcement/domains/user/schema'),
    require('@announcement/domains/announcement/schema'),
]

const apps = () => [
    new HealthCheck({ checks: [getPostgresHealthCheck(), getRedisHealthCheck()] }),
    new StitchSchemaMiddleware({ apiUrl: '/graphql' }),
    new CondoOIDCMiddleware(),
    new FeaturesMiddleware(),
    FileAdapter.makeFileAdapterMiddleware(),
]

const tasks = () => []

module.exports = prepareKeystone({
    lastApp, schemas, apps, tasks,
})