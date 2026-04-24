const express = require('express')

const conf = require('@open-condo/config')
const { GQLErrorCode: { INTERNAL_ERROR } } = require('@open-condo/keystone/errors')
const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')
const { getByCondition, getSchemaCtx } = require('@open-condo/keystone/schema')
const { getExpressErrorHandler } = require('@open-condo/keystone/utils/errors/expressErrorHandler')
const { OIDCMiddleware } = require('@open-condo/miniapp-utils/helpers/oidc')
const { getWebhookModels } = require('@open-condo/webhooks/schema')
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')

const { makeFileAdapterMiddleware } = require('@dev-portal-api/domains/common/utils/files')
const { OIDC_AUTH_ERROR } = require('@dev-portal-api/domains/user/constants/errors')
const { User } = require('@dev-portal-api/domains/user/utils/serverSchema')

const schemas = () => [
    require('@dev-portal-api/domains/user/schema'),
    require('@dev-portal-api/domains/miniapp/schema'),
    getWebhookModels('@app/dev-portal-api/schema.graphql'),
]

const apps = () => {
    const allApps = [
        makeFileAdapterMiddleware(),
    ]
    if (conf['OIDC_CONDO_CLIENT_CONFIG']) {
        const oidcConfig = JSON.parse(conf['OIDC_CONDO_CLIENT_CONFIG'])

        allApps.push(new OIDCMiddleware({
            getSession (req, _res) {
                return  req.session
            },
            oidcConfig,
            redirectUri: `${conf['DEV_PORTAL_WEB_DOMAIN']}/api/oidc/callback`,
            middlewareOptions: {
                app: express(),
            },
            onError: getExpressErrorHandler({
                code: INTERNAL_ERROR,
                type: OIDC_AUTH_ERROR,
                message: 'OIDC Authorization failed',
            }),
            async onAuthSuccess (req, _res, { userInfo }) {
                if (
                    !userInfo ||
                    typeof userInfo.sub !== 'string'
                ) {
                    throw new Error('Invalid user info')
                }

                const { keystone } = getSchemaCtx('User')
                const context = await keystone.createContext({ skipAccessControl: true })

                let user = await getByCondition('User', { id: userInfo.sub, deletedAt: null })

                if (user) {
                    if (typeof userInfo.name === 'string' && userInfo.name.trim() !== user.name) {
                        await User.update(context, user.id, {
                            dv: 1,
                            sender: { dv: 1, fingerprint: 'condo-oidc' },
                            name: userInfo.name.trim(),
                        })
                    }
                } else if (typeof userInfo.name !== 'string') {
                    throw new Error('User name is required for user creation')
                } else {
                    user = await User.create(context, {
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'condo-oidc' },
                        name: userInfo.name.trim(),
                    })
                    user = await keystone.lists['User'].adapter.update(user.id, { id: userInfo.sub })
                }

                await keystone._sessionManager.startAuthedSession(req, {
                    item: { id: user.id },
                    list: keystone.lists['User'],
                    meta: {
                        source: 'oidc',
                        provider: 'condo',
                        clientID: oidcConfig.clientId,
                    },
                })
            },
        }))
    }

    return allApps
}

const tasks = () => [
    getWebhookTasks(),
]

module.exports = prepareKeystone({
    schemas, apps, tasks,
})
