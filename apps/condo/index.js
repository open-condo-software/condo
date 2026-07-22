const { NextApp } = require('@open-keystone/app-next')
const cookieSignature = require('cookie-signature')
const dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
const isBetween = require('dayjs/plugin/isBetween')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')
const express = require('express')
const jwt = require('jsonwebtoken')

const conf = require('@open-condo/config')
const { FeaturesMiddleware } = require('@open-condo/featureflags/FeaturesMiddleware')
const { FileMiddleware } = require('@open-condo/files/fileMiddleware')
const { AdapterCache } = require('@open-condo/keystone/adapterCache')
const { GQLError, GQLErrorCode: { FORBIDDEN } } = require('@open-condo/keystone/errors')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const {
    HealthCheck,
    getRedisHealthCheck,
    getPostgresHealthCheck,
    getPfxCertificateHealthCheck,
} = require('@open-condo/keystone/healthCheck')
const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')
const { RequestCache } = require('@open-condo/keystone/requestCache')
const { find } = require('@open-condo/keystone/schema')
const { MessagingMiddleware, setupMessaging } = require('@open-condo/messaging')
const { getWebhookModels } = require('@open-condo/webhooks/schema')
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')

const { PaymentLinkMiddleware } = require('@condo/domains/acquiring/PaymentLinkMiddleware')
const { WEBHOOK_EVENTS } = require('@condo/domains/common/constants/webhooks')
const { MultiPartMiddleware } = require('@condo/domains/common/multipart')
const { VersioningMiddleware } = require('@condo/domains/common/utils/VersioningMiddleware')
const { ACCESS_TOKEN_SESSION_ID_PREFIX } = require('@condo/domains/miniapp/constants')
const { VoIPMiddleware } = require('@condo/domains/miniapp/VoIPMiddleware')
const { UnsubscribeMiddleware } = require('@condo/domains/notification/UnsubscribeMiddleware')
const { UserExternalIdentityMiddleware } = require('@condo/domains/user/integration/UserExternalIdentityMiddleware')
const { OIDCMiddleware } = require('@condo/domains/user/oidc')
const { getKVClient } = require('@open-condo/keystone/kv')

dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isBetween)

const IS_BUILD_PHASE = conf.PHASE === 'build'

// TODO(zuch): DOMA-2990: add FILE_FIELD_ADAPTER to env during build phase
if (IS_BUILD_PHASE) {
    process.env.FILE_FIELD_ADAPTER = 'local' // Test
}

const kv = getKVClient('fing/multipart-upload')

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
    getWebhookModels('@app/condo/schema.graphql', WEBHOOK_EVENTS),
    require('@open-condo/files/schema'),
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
    require('@condo/domains/subscription/tasks'),
]

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
        new MessagingMiddleware(),
        new PaymentLinkMiddleware(),
        new UnsubscribeMiddleware(),
        //new FileMiddleware({ apiPrefix: '/api/files' }),
        new class NoneFileMiddleware {
            prepareMiddleware () {
                const app = express()
                const appConfig = FileMiddleware.prototype.loadConfig()
                const appClients = appConfig?.clients ?? {}
                app.post('/api/files' + '/attach', async (req, res) => {
                    const { signature, fileClientId } = req.body
                    let data
                    let appClient
                    try {
                        appClient = appClients?.[fileClientId]
                        if (!appClient) throw new Error('no appClient')
                        data = jwt.verify(signature, appClient.secret, { algorithms: ['HS256'] })
                    } catch (err) {
                        console.error(err)
                        return res.setHeader('Content-Type', 'application/json').status(400).json({ error: 'no signature' })
                    }
                    console.log('COOKIE', req.cookies, req.signedCookies)
                    const updatedId = data.id
                    let newFileData
                    try {
                        newFileData = JSON.parse(await kv.get(`multipart-upload-uuid-to-file-data:${updatedId}`))
                        if (!newFileData.filename || !newFileData.originalFilename) {
                            throw new Error('No filename')
                        }
                    } catch (err) {
                        console.error(err)
                        return res.setHeader('Content-Type', 'application/json').status(400).json({ error: 'no upload data' })
                    }

                    return res.setHeader('Content-Type', 'application/json').status(200).json({
                        data: {
                            file: {
                                signature: jwt.sign(
                                    newFileData,
                                    appClient.secret,
                                    { expiresIn: '5m', algorithm: 'HS256' }
                                ),
                            },
                        },
                    })
                })
                app.set('trust proxy', true)
                return app
            }
        }(),
        FileAdapter.makeFileAdapterMiddleware(),
        new UserExternalIdentityMiddleware(),
        new VoIPMiddleware(),
        new MultiPartMiddleware(),
    ]
}

/** @type {(app: import('express').Application) => void} */
const extendExpressApp = (app) => {
    // shared state visible to the helper
    app.locals._grace = app.locals._grace || { draining: false, inflight: 0 }

    app.get('/.well-known/apollo/server-health', (req, res, next) => {
        if (req.app.locals._grace.draining) return res.status(503).json({ status: 'shutting_down' })
        next()
    })

    app.get('/.well-known/change-password', function (req, res) {
        res.redirect('/auth/forgot')
    })
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

setupMessaging({
    accessCheckers: {
        organization: async (context, userId, organizationId) => {
            const employees = await find('OrganizationEmployee', {
                user: { id: userId },
                organization: { id: organizationId },
                isAccepted: true,
                isRejected: false,
                isBlocked: false,
                deletedAt: null,
            })
            return employees.length > 0
        },
    },
})

module.exports = prepareKeystone({
    extendExpressApp,
    schemas, tasks, queues: ['low', 'medium', 'high'],
    apps, lastApp,
    ui: { hooks: require.resolve('@app/condo/admin-ui') },
    authStrategyOpts,
})
