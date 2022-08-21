const { isObject } = require('lodash')
const { generators } = require('openid-client') // certified openid client will all checks

const { getSchemaCtx } = require('@condo/keystone/schema')

const { getSbbolUserInfoErrors, SBBOL_SESSION_KEY } = require('./common')
const sync = require('./sync')
const { getOnBoardingStatus } = require('./sync/getOnBoadringStatus')
const { initializeSbbolAuthApi } = require('./utils')
const { getLogger } = require('@condo/keystone/logging')

const logger = getLogger('sbbol/routes')


class SbbolRoutes {

    async startAuth (req, res, next) {
        const sbbolAuthApi = await initializeSbbolAuthApi()

        // nonce: to prevent several callbacks from same request
        // state: to validate user browser on callback
        const checks = { nonce: generators.nonce(), state: generators.state() }
        req.session[SBBOL_SESSION_KEY] = checks
        await req.session.save()
        try {
            const redirectUrl = sbbolAuthApi.authorizationUrlWithParams(checks)
            return res.redirect(redirectUrl)
        } catch (error) {
            return next(error)
        }
    }

    async completeAuth (req, res, next) {
        const reqId = req.id
        const sbbolAuthApi = await initializeSbbolAuthApi()
        try {
            if (!isObject(req.session[SBBOL_SESSION_KEY])) {
                logger.info({ msg: 'SBBOL invalid nonce and state', reqId })
                return res.status(400).send('ERROR: Invalid nonce and state')
            }

            // This is NOT a `TokenSet` record from our schema
            const tokenSet = await sbbolAuthApi.completeAuth(req, req.session[SBBOL_SESSION_KEY])
            const { keystone } = await getSchemaCtx('User')
            const { access_token } = tokenSet
            const userInfo = await sbbolAuthApi.fetchUserInfo(access_token)
            const errors = getSbbolUserInfoErrors(userInfo)
            if (errors.length) {
                logger.info({ msg: 'SBBOL invalid userinfo', data: { userInfo, errors }, reqId })
                return res.status(400).send(`ERROR: Invalid SBBOL userInfo: ${errors.join(';')}`)
            }
            const {
                user,
                organizationEmployeeId,
            } = await sync({ keystone, userInfo, tokenSet, reqId })
            await keystone._sessionManager.startAuthedSession(req, { item: { id: user.id }, list: keystone.lists['User'] })

            if (organizationEmployeeId) {
                res.cookie('organizationLinkId', organizationEmployeeId)
            }
            delete req.session[SBBOL_SESSION_KEY]
            await req.session.save()

            const { finished } = await getOnBoardingStatus(user)

            if (!finished) return res.redirect('/onboarding')
            
            return res.redirect('/')
        } catch (error) {
            return next(error)
        }
    }
}

module.exports = {
    SbbolRoutes,
}
