const { NextApp } = require('@open-keystone/app-next')

const conf = require('@open-condo/config')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const {
    HealthCheck,
    getRedisHealthCheck,
    getPostgresHealthCheck,
} = require('@open-condo/keystone/healthCheck')
const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')
// @if STITCH
const { StitchSchemaMiddleware } = require('@open-condo/keystone/stitchSchema')

// @endif
// @if OIDC
const { CondoOIDCMiddleware } = require('./middlewares/oidc')
// @endif

const lastApp = conf.DISABLE_NEXT_APP ? undefined : new NextApp({ dir: '.' })

const schemas = () => [
    require('~/domains/user/schema'),
]

const tasks = () => []

const apps = () => [
    new HealthCheck({ checks: [getPostgresHealthCheck(), getRedisHealthCheck()] }),
    // @if STITCH
    new StitchSchemaMiddleware({
        apiUrl: '/graphql',
        appTokenKey: 'appAPIToken',
        condoAccessTokenKey: 'condoAPIToken',
    }),
    // @endif
    // @if OIDC
    new CondoOIDCMiddleware(),
    // @endif
    FileAdapter.makeFileAdapterMiddleware(),
]

module.exports = prepareKeystone({
    lastApp,
    schemas,
    tasks,
    apps,
})
