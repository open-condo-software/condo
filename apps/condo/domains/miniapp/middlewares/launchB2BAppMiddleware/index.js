const cookieParser = require('cookie-parser')
const express = require('express')
const { get } = require('lodash')

const { getByCondition } = require('@open-condo/keystone/schema')

const LaunchB2BAppHelpers = require('./helpers')


class LaunchB2BAppMiddleware {
    async prepareMiddleware () {
        const helpers = LaunchB2BAppHelpers.getInstance()
        const { config, jwksResponse, signLaunchParams } = helpers

        const app = express()
        app.use(cookieParser())

        app.get('/api/miniapp/launch/jwks', (req, res) => {
            // implementation from 'oidc-provider'
            // analogue of redirect to '/oidc/jwks'
            return res
                .type('application/jwk-set+json; charset=utf-8')
                .json(jwksResponse)
        })

        app.head('/api/miniapp/launch', async (req, res) => {

            // 1) Check user is authorized
            const authorizedUserId = get(req, 'user.id')
            if (!authorizedUserId) return res.status(401).send('Unauthorized user')

            // 2) Check req has appId, b2bApp, appUrl
            const b2bAppId = get(req, 'query.id')
            if (!b2bAppId) return res.status(400).send('No appId')

            // 3) Check req from CRM
            const referer = req.get('Referer')
            if (!referer || config.whiteList.every((fn) => fn(b2bAppId) !== referer)) {
                return res.status(403).send('Invalid source')
            }

            // 4) Check req has appUrl in b2bApp
            const b2bApp = await getByCondition('B2BApp', {
                id: b2bAppId,
                deletedAt: null,
            })
            const appUrl = get(b2bApp, 'appUrl')
            if (!appUrl) return res.status(400).send('Not found app url')

            return res.redirect(appUrl)
        })

        app.get('/api/miniapp/launch', async (req, res) => {

            // 1) Check user is authorized
            const authorizedUserId = get(req, 'user.id')
            if (!authorizedUserId) return res.status(401).send('Unauthorized user')

            // 2) Check req has appId
            const b2bAppId = get(req, 'query.id')
            if (!b2bAppId) return res.status(400).send('No appId')

            // 3) Check req from CRM
            const referer = req.get('Referer')
            if (!referer || config.whiteList.every((fn) => fn(b2bAppId) !== referer)) {
                return res.status(403).send('Invalid source')
            }

            // 4) Check req has organizationLinkId
            const employeeId = get(req, 'cookies.organizationLinkId')
            if (!employeeId) return res.status(400).send('No organizationLinkId')

            // 5) Check employee for authorized user
            const employee = await getByCondition('OrganizationEmployee', {
                id: employeeId,
                deletedAt: null,
                user: { id: authorizedUserId, deletedAt: null },
                organization: { deletedAt: null },
            })
            if (!employee) return res.status(403).send('Not found employee')

            // 6) Get organization id from employee
            const organizationId = get(employee, 'organization')
            if (!organizationId) return res.status(403).send('Not found organization')

            // 7) Check context between organization and appId
            const b2bAppContext = await getByCondition('B2BAppContext', {
                app: { id: b2bAppId, deletedAt: null },
                organization: { id: organizationId, deletedAt: null },
                deletedAt: null,
            })
            if (!b2bAppContext) return res.status(403).send('Don\'t have access to app')

            // 8) Get b2b app
            const b2bApp = await getByCondition('B2BApp', {
                id: b2bAppContext.app,
                deletedAt: null,
            })
            if (!b2bApp) return res.status(400).send('Not found app')

            // 9) Get app url from app
            const appUrl = get(b2bApp, 'appUrl')
            if (!appUrl) return res.status(400).send('Not found app url')

            // 10) Sign launch params
            let signedLaunchParams
            try {
                signedLaunchParams = await signLaunchParams.call(helpers, b2bAppId, appUrl, authorizedUserId, organizationId)
            } catch (error) {
                console.error(error)
                return res.status(500).send(error)
            }
            // 11) Build link to miniapp with sign, condoOrganizationId and condoUserId
            const url = new URL(appUrl)
            url.searchParams.set('launchParams', signedLaunchParams)
            // deprecated params (For backward compatibility)
            url.searchParams.set('condoOrganizationId', organizationId)
            url.searchParams.set('condoUserId', authorizedUserId)
            const redirectUrl = url.toString()

            // 12) Redirect to generated link
            return res.redirect(redirectUrl)

        })

        return app
    }
}

module.exports = {
    LaunchB2BAppMiddleware,
}
