const { isObject } = require('lodash')
const { generators } = require('openid-client') // certified openid client will all checks
const { getSchemaCtx } = require('@core/keystone/schema')
const { SbbolUserInfoJSONValidation, SBBOL_SESSION_KEY } = require('./common')
const { SbbolOauth2Api } = require('./oauth2')
const sync = require('./sync')

class SbbolRoutes {
    constructor () {
        this.helper = new SbbolOauth2Api()
    }

    async startAuth (req, res, next) {
        // nonce: to prevent several callbacks from same request
        // state: to validate user browser on callback
        const checks = { nonce: generators.nonce(), state: generators.state() }
        req.session[SBBOL_SESSION_KEY] = checks
        await req.session.save()
        try {
            const redirectUrl = this.helper.authorizationUrlWithParams(checks)
            return res.redirect(redirectUrl)
        } catch (error) {
            return next(error)
        }
    }

    async completeAuth (req, res, next) {
        try {
            if (!isObject(req.session[SBBOL_SESSION_KEY])) {
                return res.status(400).send('ERROR: Invalid nonce and state')
            }

            const tokenSet = await this.helper.completeAuth(req, req.session[SBBOL_SESSION_KEY])
            const { keystone } = await getSchemaCtx('User')
            const { access_token } = tokenSet
            const userInfo = await this.helper.fetchUserInfo(access_token)
            if (!SbbolUserInfoJSONValidation(userInfo)) {
                return res.status(400).send(`ERROR: Invalid SBBOL userInfo: ${JSON.stringify(userInfo)}`)
            }
            const {
                user,
                organizationEmployeeId,
            } = await sync({ keystone, userInfo, tokenSet })
            await keystone._sessionManager.startAuthedSession(req, { item: { id: user.id }, list: keystone.lists['User'] })
            if (organizationEmployeeId) {
                res.cookie('organizationLinkId', organizationEmployeeId)
            }
            delete req.session[SBBOL_SESSION_KEY]
            await req.session.save()
            return res.redirect('/onboarding')
        } catch (error) {
            return next(error)
        }
    }
}

module.exports = {
    SbbolRoutes,
}
