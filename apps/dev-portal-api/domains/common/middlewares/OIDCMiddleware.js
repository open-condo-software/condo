const express = require('express')

const conf = require('@open-condo/config')
const { GQLErrorCode: { INTERNAL_ERROR } } = require('@open-condo/keystone/errors')
const { getSchemaCtx, getByCondition } = require('@open-condo/keystone/schema')
const { getExpressErrorHandler } = require('@open-condo/keystone/utils/errors/expressErrorHandler')
const { nonNull } = require('@open-condo/miniapp-utils/helpers/collections')
const { OIDCMiddleware } = require('@open-condo/miniapp-utils/helpers/oidc')

const { OIDC_AUTH_ERROR } = require('@dev-portal-api/domains/user/constants/errors')
const { User } = require('@dev-portal-api/domains/user/utils/serverSchema')

function makeOIDCMiddleware () {
    if (!conf['OIDC_CONDO_CLIENT_CONFIG']) return null

    const oidcConfig = JSON.parse(conf['OIDC_CONDO_CLIENT_CONFIG'])

    return new OIDCMiddleware({
        getSession (req, _res) {
            return  req.session
        },
        oidcConfig,
        redirectUri: [
            `${conf['DEV_PORTAL_WEB_DOMAIN']}/api/oidc/callback`,
            conf['ENABLE_DIRECT_OIDC'] === 'true' ? `${conf['DEV_PORTAL_API_DOMAIN']}/api/oidc/callback` : null,
        ].filter(nonNull),
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
    })
}

module.exports = {
    OIDCMiddleware: makeOIDCMiddleware(),
}