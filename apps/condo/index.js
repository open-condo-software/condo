const { NextApp } = require('@keystonejs/app-next')
const Sentry = require('@sentry/node')
const dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
const isBetween = require('dayjs/plugin/isBetween')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')

const conf = require('@open-condo/config')
const { FeaturesMiddleware } = require('@open-condo/featureflags/FeaturesMiddleware')
const { AdapterCache } = require('@open-condo/keystone/adapterCache')
const { GQLError, GQLErrorCode: { FORBIDDEN } } = require('@open-condo/keystone/errors')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const {
    DEFAULT_HEALTHCHECK_URL,
    HealthCheck,
    getRedisHealthCheck,
    getPostgresHealthCheck,
    getPfxCertificateHealthCheck,
} = require('@open-condo/keystone/healthCheck')
const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')
const { getLogger } = require('@open-condo/keystone/logging')
const { RequestCache } = require('@open-condo/keystone/requestCache')
const { getWebhookModels } = require('@open-condo/webhooks/schema')
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')

const { PaymentLinkMiddleware } = require('@condo/domains/acquiring/PaymentLinkMiddleware')
const { VersioningMiddleware, getCurrentVersion } = require('@condo/domains/common/utils/VersioningMiddleware')
const { ACCESS_TOKEN_SESSION_ID_PREFIX } = require('@condo/domains/miniapp/constants')
const { UnsubscribeMiddleware } = require('@condo/domains/notification/UnsubscribeMiddleware')
const { UserExternalIdentityMiddleware } = require('@condo/domains/user/integration/UserExternalIdentityMiddleware')
const { OIDCMiddleware } = require('@condo/domains/user/oidc')

dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isBetween)

const IS_BUILD_PHASE = conf.PHASE === 'build'
const SENTRY_CONFIG = conf.SENTRY_CONFIG ? JSON.parse(conf.SENTRY_CONFIG) : {}

const logger = getLogger('condo-index')

// TODO(zuch): DOMA-2990: add FILE_FIELD_ADAPTER to env during build phase
if (IS_BUILD_PHASE) {
    process.env.FILE_FIELD_ADAPTER = 'local' // Test
}

const schemas = () => [
    require('@condo/domains/common/schema'),
    require('@condo/domains/user/schema'),
    require('@condo/domains/organization/schema'),
    require('@condo/domains/property/schema'),
    require('@condo/domains/billing/schema'),
    require('@condo/domains/banking/schema'),
    require('@condo/domains/ticket/schema'),
    require('@condo/domains/notification/schema'),
    require('@condo/domains/contact/schema'),
    require('@condo/domains/resident/schema'),
    require('@condo/domains/onboarding/schema'),
    require('@condo/domains/meter/schema'),
    require('@condo/domains/subscription/schema'),
    require('@condo/domains/acquiring/schema'),
    require('@condo/domains/analytics/schema'),
    require('@condo/domains/scope/schema'),
    require('@condo/domains/news/schema'),
    require('@condo/domains/miniapp/schema'),
    require('@condo/domains/settings/schema'),
    require('@condo/domains/marketplace/schema'),
    require('@condo/domains/document/schema'),
    require('@condo/domains/ai/schema'),
    getWebhookModels('@app/condo/schema.graphql'),
]

const tasks = () => [
    require('@condo/domains/common/tasks'),
    require('@condo/domains/acquiring/tasks'),
    require('@condo/domains/notification/tasks'),
    require('@condo/domains/organization/tasks'),
    require('@condo/domains/ticket/tasks'),
    require('@condo/domains/resident/tasks'),
    require('@condo/domains/scope/tasks'),
    require('@condo/domains/news/tasks'),
    require('@condo/domains/miniapp/tasks'),
    getWebhookTasks('low'),
    require('@condo/domains/marketplace/tasks'),
    require('@condo/domains/analytics/tasks'),
    require('@condo/domains/ai/tasks'),
]

if (!IS_BUILD_PHASE && SENTRY_CONFIG['server']) {
    Sentry.init({
        dsn: SENTRY_CONFIG['server']['dsn'],
        debug: false,
        tracesSampleRate: SENTRY_CONFIG['server']['sampleRate'],
        sampleRate: SENTRY_CONFIG['server']['sampleRate'],
        environment: SENTRY_CONFIG['server']['environment'],
        organization: SENTRY_CONFIG['server']['organization'],
        project: SENTRY_CONFIG['server']['project'],
        release: `${SENTRY_CONFIG['server']['environment']}-${getCurrentVersion()}`,
    })
}

const checks = [
    getRedisHealthCheck(),
    getPostgresHealthCheck(),
    getPfxCertificateHealthCheck({
        certificateName: 'sber_id_client',
        getPfxParams: () => {
            const { certificate, passphrase } = conf['SBER_ID_CONFIG'] && JSON.parse(conf['SBER_ID_CONFIG']) || {}
            return { pfx: certificate, passphrase }
        },
    }),
    getPfxCertificateHealthCheck({
        certificateName: 'sbbol_client',
        getPfxParams: () => {
            const SBBOL_PFX = conf['SBBOL_PFX'] && JSON.parse(conf['SBBOL_PFX']) || {}
            return { pfx: SBBOL_PFX.certificate, passphrase: SBBOL_PFX.passphrase }
        },
    }),
    getPfxCertificateHealthCheck({
        certificateName: 'sbbol_client_extended',
        getPfxParams: () => {
            const SBBOL_PFX_EXTENDED = conf['SBBOL_PFX_EXTENDED'] && JSON.parse(conf['SBBOL_PFX_EXTENDED']) || {}
            return { pfx: SBBOL_PFX_EXTENDED.certificate, passphrase: SBBOL_PFX_EXTENDED.passphrase }
        },
    }),
]

const lastApp = conf.DISABLE_NEXT_APP ? undefined : new NextApp({ dir: '.' })

const apps = () => {
    return [
        new HealthCheck({ checks }),
        new RequestCache(conf.REQUEST_CACHE_CONFIG ? JSON.parse(conf.REQUEST_CACHE_CONFIG) : { enabled: false }),
        new AdapterCache(conf.ADAPTER_CACHE_CONFIG ? JSON.parse(conf.ADAPTER_CACHE_CONFIG) : { enabled: false }),
        new VersioningMiddleware(),
        new OIDCMiddleware(),
        new FeaturesMiddleware(),
        new PaymentLinkMiddleware(),
        new UnsubscribeMiddleware(),
        FileAdapter.makeFileAdapterMiddleware(),
        new UserExternalIdentityMiddleware(),
    ]
}

/** @type {(app: import('express').Application) => void} */
const extendExpressApp = (app) => {
    const runtimeStats = {
        activeRequestsIds: new Set(),
        activeRequestsCountByType: {
            graphql: 0,
            api: 0,
            oidc: 0,
            wellKnown: 0,
            healthCheck: 0,
            other: 0,
        },
        totalRequestsCount: 0,
        totalRequestsByTarget: {},
    }

    app.use(function runtimeStatsMiddleware (req, res, next) {
        try {
            const url = new URL(`${conf['SERVER_URL']}${req.url}`).pathname
            const method = (req.method || 'get').toLowerCase()

            // According to ADR35
            const possibleXTargetValues = (conf['POSSIBLE_X_TARGET_VALUES'] || '').split(',')
            const xTargetHeader = req.headers['x-target']

            const xTarget = possibleXTargetValues.includes(xTargetHeader) ? xTargetHeader : 'other'

            const isPost = method === 'post'

            const isAdminApiUrl = url === '/admin/api'
            const isApiUrl = url.startsWith('/api')
            const isOidcUrl = url.startsWith('/oidc')
            const isWellKnownUrl = url.startsWith('/.well-known')
            const isHealthCheckUrl = url.startsWith(DEFAULT_HEALTHCHECK_URL)

            /** @type {'api' | 'graphql' | 'oidc' | 'wellKnown' | 'healthCheck' | 'other'} */
            let requestType = 'other'

            if (isPost && isAdminApiUrl) {
                requestType = 'graphql'
            } else if (isApiUrl) {
                requestType = 'api'
            } else if (isOidcUrl) {
                requestType = 'oidc'
            } else if (isWellKnownUrl) {
                requestType = 'wellKnown'
            } else if (isHealthCheckUrl) {
                requestType = 'healthCheck'
            }

            if (requestType) {
                runtimeStats.activeRequestsIds.add(req.id)
                runtimeStats.activeRequestsCountByType[requestType] = (runtimeStats.activeRequestsCountByType[requestType] || 0) + 1
                runtimeStats.totalRequestsCount = (runtimeStats.totalRequestsCount || 0) + 1
                runtimeStats.totalRequestsByTarget[xTarget] = (runtimeStats.totalRequestsByTarget[xTarget] || 0) + 1
            }

            res.on('close', () => {
                if (requestType) {
                    runtimeStats.activeRequestsIds.delete(req.id)
                    runtimeStats.activeRequestsCountByType[requestType] = Math.max(0, runtimeStats.activeRequestsCountByType[requestType] - 1)
                }
            })
        } catch (error) {
            logger.error({ msg: 'runtimeStatsMiddleware error', error, data: { url: req.url, method: req.method } })
        }

        next()
    })

    app.get('/.well-known/runtime-stats', (req, res) => {
        const token = req.query['token']
        const accessToken = conf['RUNTIME_STATS_ACCESS_TOKEN']
        if (!!accessToken && accessToken === token) {
            res.json({
                activeRequestsCount: runtimeStats.activeRequestsIds.size,
                activeRequestsCountByType: runtimeStats.activeRequestsCountByType,
                totalRequestsCount: runtimeStats.totalRequestsCount,
                totalRequestsCountByTarget: runtimeStats.totalRequestsByTarget,
            })
        } else {
            res.status(403).send()
        }
    })

    app.get('/.well-known/change-password', function (req, res) {
        res.redirect('/auth/forgot')
    })
    app.use(Sentry.Handlers.errorHandler())
}

const authStrategyOpts = {
    hooks: {
        // Sessions linked can be permanent tokens can only be destroyed by deleting linking model, such as B2BAppToken
        beforeUnauth ({ context }) {
            const sessionId = context.req.sessionID
            const isManualSession = [ACCESS_TOKEN_SESSION_ID_PREFIX].some(prefix => sessionId.startsWith(prefix))
            if (isManualSession) {
                throw new GQLError({
                    type: FORBIDDEN,
                    code: FORBIDDEN,
                    message: 'You can not log out with token',
                }, context)
            }
        },
    },
}

module.exports = prepareKeystone({
    extendExpressApp,
    schemas, tasks, queues: ['low', 'medium', 'high'],
    apps, lastApp,
    ui: { hooks: require.resolve('@app/condo/admin-ui') },
    authStrategyOpts,
})
