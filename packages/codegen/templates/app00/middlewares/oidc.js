const express = require('express')
const { get, isObject, isString } = require('lodash')
const { generators } = require('openid-client')
const { validate: isUUID } = require('uuid')

const {
    APP_TOKEN_KEY,
    CONDO_ACCESS_TOKEN_KEY,
    CONDO_ORGANIZATION_ID_KEY,
    CONDO_REFRESH_TOKEN_KEY,
} = require('@{{name}}/domains/condo/constants')
const { getOrganizationPermissions } = require('@{{name}}/domains/condo/utils/access')
const { OIDCHelper } = require('@{{name}}/domains/condo/utils/oidcHelper')
const { createOrUpdateUser } = require('@{{name}}/domains/user/utils/serverSchema/createOrUpdateUser')


const verifyEmployee = async (context, condoUserId, condoOrganizationId) => {
    if (!isUUID(condoUserId) || !isUUID(condoOrganizationId) || !context) return false

    const permissions = await getOrganizationPermissions(context, condoUserId, condoOrganizationId)
    return isObject(permissions)
}

class CondoOIDCMiddleware {
    prepareMiddleware ({ keystone }) {
        // this route can not be used for csrf attack (use oidc-client library to handle auth flows properly)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        const oidcSessionKey = 'oidc'
        const nextUrlKey = 'next'
        const launchParamsKey = 'launchParams'
        const helper = OIDCHelper.getInstance()

        app.head('/launch', async (req, res) => {
            return res.sendStatus(200)
        })

        /**
         * B2B app entry point.
         *
         * When opening a b2b app, you must specify this path,
         * otherwise employees will not be able to access organization objects
         *
         * The employee goes through three steps
         * 1) /launch - check that the launch parameters have been passed
         * (There should still be a verification of the signature at this step, but the signature has not yet been implemented)
         * 2) /auth - If the user is not authorized, then authorize, otherwise skip the step
         * 3) /verify-employee - We check that the user is an employee of the specified organization and has access to open the miniapp
         * 4) If no errors occurred during checks, then remember the organization and reuse it to access objects
         */
        app.get('/launch', async (req, res) => {
            const queryParams = get(req, 'query', {})

            const condoOrganizationId = get(queryParams, 'condoOrganizationId')
            const condoUserId = get(queryParams, 'condoUserId')
            const nextUrl = get(queryParams, 'next')
            const authorizedUserId = get(req, 'user.id')

            let errorText, errorStatus = 400
            if (!condoOrganizationId) errorText = 'ERROR: No required parameter "condoOrganizationId"'
            if (!condoUserId) errorText = 'ERROR: No required parameter "condoUserId"'
            if (errorText) {
                await req.session.destroy()
                return res.status(errorStatus).send(errorText)
            }

            req.session[launchParamsKey] = { condoOrganizationId, condoUserId, nextUrl }
            await req.session.save()

            if (authorizedUserId && condoUserId && condoUserId === authorizedUserId) {
                return res.redirect('/verify-employee')
            } else {
                return res.redirect(`/oidc/auth?next=${encodeURIComponent('/verify-employee')}`)
            }
        })

        app.get('/verify-employee', async (req, res, next) => {
            const launchParams = get(req, 'session.launchParams')
            const accessToken = get(req, ['session', CONDO_ACCESS_TOKEN_KEY])
            const authorizedUserId = get(req, 'user.id')
            const condoOrganizationId = get(launchParams, 'condoOrganizationId')
            const condoUserId = get(launchParams, 'condoUserId')
            const nextUrl = get(launchParams, 'nextUrl') || '/'

            delete req.session[launchParamsKey]
            await req.session.save()

            let errorText, errorStatus = 400
            if (condoUserId !== authorizedUserId) errorText = 'ERROR: Authorized user is different from launching user'
            if (!condoUserId) errorText = 'ERROR: No launchParams.condoUserId'
            if (!condoOrganizationId) errorText = 'ERROR: No launchParams.condoOrganizationId'
            if (!launchParams) errorText = 'ERROR: No launchParams'
            if (!accessToken) {
                errorStatus = 401
                errorText = 'ERROR: No access token'
            }
            if (!authorizedUserId) {
                errorStatus = 401
                errorText = 'ERROR: Unauthorized'
            }
            if (errorText) {
                await req.session.destroy()
                return res.status(errorStatus).send(errorText)
            }

            try {
                const verifiedEmployee = await verifyEmployee({ req }, condoUserId, condoOrganizationId)

                if (verifiedEmployee) {
                    req.session[CONDO_ORGANIZATION_ID_KEY] = condoOrganizationId
                    await req.session.save()

                    return res.redirect(nextUrl)
                } else {
                    await req.session.destroy()
                    return res.status(403).send('ERROR: Employee was not found!')
                }
            } catch (error) {
                await req.session.destroy()
                return next(error)
            }
        })

        // Endpoint to start session for third-party embedded page while opened as first-party
        app.get('/grant-storage-access/:id', async (req, res, next) => {
            req.session['sessionStarted'] = true
            await req.session.save()
            return next()
        })

        app.get('/oidc/auth', async (req, res, next) => {
            const checks = { nonce: generators.nonce(), state: generators.state() }
            req.session[oidcSessionKey] = checks

            const nextUrl = get(req, 'query.next')
            if (isString(nextUrl)) {
                req.session[nextUrlKey] = nextUrl
            }

            await req.session.save()
            try {
                const redirectUrl = helper.getAuthorizationUrlWithParams(checks)
                return res.redirect(redirectUrl)
            } catch (err) {
                await req.session.destroy()
                return next(err)
            }
        })

        app.get('/oidc/callback', async (req, res, next) => {
            try {
                const checks = req.session[oidcSessionKey]
                const nextUrl = req.session[nextUrlKey] || '/'
                const launchParams = req.session[launchParamsKey]

                if (!isObject(checks) || !checks) {
                    await req.session.destroy()
                    return res.status(400).send('ERROR: Invalid nonce and state')
                }

                const { accessToken, refreshToken, tokenExpiresAt, userInfo } = await helper.completeAuth(req, checks)
                const user = await createOrUpdateUser(keystone, userInfo)
                const appToken = await keystone._sessionManager.startAuthedSession(req, {
                    item: { id: user.id },
                    list: keystone.lists['User'],
                    meta: {
                        source: 'oidc',
                        provider: 'condo',
                        clientID: helper.clientID,
                    },
                })

                req.session[CONDO_ACCESS_TOKEN_KEY] = accessToken
                req.session[CONDO_REFRESH_TOKEN_KEY] = refreshToken
                req.session[APP_TOKEN_KEY] = appToken
                req.session[launchParamsKey] = launchParams

                delete req.session[oidcSessionKey]
                await req.session.save()

                return res.redirect(nextUrl)
            } catch (err) {
                await req.session.destroy()
                return next(err)
            }
        })

        app.set('trust proxy', true)

        return app
    }
}

module.exports = {
    CondoOIDCMiddleware,
}
