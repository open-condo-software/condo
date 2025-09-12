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
                    typeof userInfo.phone_number !== 'string' || // only user with phones allowed
                    !userInfo.phone_number_verified || // only verified users allowed
                    userInfo.type !== 'staff' // only staff users allowed
                ) {
                    throw new Error('Invalid user info')
                }

                // NOTE: we don't want to inherit condo support status, so we explicitly omitting it here
                const userData = {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'condo-oidc' },
                    phone: userInfo.phone_number,
                    name: userInfo.name,
                }

                const { keystone } = getSchemaCtx('User')
                const context = await keystone.createContext({ skipAccessControl: true })
                let user = await getByCondition('User', { phone: userInfo.phone_number, deletedAt: null })
                if (user) {
                    // NOTE: not updatable field
                    delete userData.phone
                    await User.update(context, user.id, userData)
                } else if (!userData.name) {
                    throw new Error('User name is required')
                } else {
                    user = await User.create(context, userData)
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
