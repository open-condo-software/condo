const { NextApp } = require('@keystonejs/app-next')
const bodyParser = require('body-parser')

const conf = require('@open-condo/config')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const {
    HealthCheck,
    getRedisHealthCheck,
    getPostgresHealthCheck,
} = require('@open-condo/keystone/healthCheck')
const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')
const { StitchSchemaMiddleware } = require('@open-condo/keystone/stitchSchema')
const { EmptyApp } = require('@open-condo/keystone/test.utils')

const { CondoOIDCMiddleware, CONDO_OIDC_TOKEN_KEY, APP_TOKEN_KEY } = require('./middlewares/oidc')

require('body-parser-xml')(bodyParser)


const apps = () => [
    new HealthCheck({ checks: [
        getPostgresHealthCheck(),
        getRedisHealthCheck(),
    ] }),
    new StitchSchemaMiddleware({
        apiUrl: '/graphql', appTokenKey: APP_TOKEN_KEY, condoAccessTokenKey: CONDO_OIDC_TOKEN_KEY,
    }),
    new CondoOIDCMiddleware(),
    FileAdapter.makeFileAdapterMiddleware(),
]

const schemas = () => [
    require('@billing-connector/domains/user/schema'),
    require('@billing-connector/domains/selfservice/schema'),
]

const lastApp = conf.DISABLE_NEXT_APP ? new EmptyApp() : new NextApp({ dir: '.' })

module.exports = prepareKeystone({
    apps, schemas, lastApp,
})
