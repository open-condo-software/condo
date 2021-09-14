const { generators } = require('openid-client') // certified openid client will all checks
const { SbbolUserInfoJSONValidation, SBBOL_SESSION_KEY } = require('@condo/domains/organization/sbbol/common')
const { SbbolOauth2Api } = require('@condo/domains/organization/sbbol/oauth2')
const { SbbolOrganization } = require('@condo/domains/organization/sbbol/synch')
const { JSON_SCHEMA_VALIDATION_ERROR } = require('@condo/domains/common/constants/errors')
const { getSchemaCtx } = require('@core/keystone/schema')

class SbbolRoutes {
    constructor () {
        this.helper = new SbbolOauth2Api()
    }

    startAuth () {
        const route = async (req, res, next) => {
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
        return route
    }

    completeAuth () {
        const route = async (req, res, next) => {
            try {
                const tokenSet = await this.helper.fetchTokens(req, SBBOL_SESSION_KEY)
                const { keystone } = await getSchemaCtx('User')
                const { access_token, refresh_token } = tokenSet
                const userInfo = await this.helper.fetchUserInfo(access_token)
                if (!SbbolUserInfoJSONValidation(userInfo)) {
                    throw new Error(`${JSON_SCHEMA_VALIDATION_ERROR}] invalid json structure for userInfo`)
                }
                const Sync = new SbbolOrganization({ keystone, userInfo })
                await Sync.init()
                await Sync.syncUser()
                const userId = Sync.user.id
                keystone._sessionManager.startAuthedSession(req, { item: { id: userId }, list: keystone.lists['User'] })
                await Sync.syncOrganization()
                await Sync.updateOrganizationRefreshToken({ refresh_token })
                delete req.session[SBBOL_SESSION_KEY]
                await req.session.save()
                return res.redirect('/')
            } catch (error) {
                return next(error)
            }
        }
        return route
    }
}

module.exports = {
    SbbolRoutes,
}