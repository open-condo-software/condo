const { isObject, get } = require('lodash')
const { generators } = require('openid-client') // certified openid client will all checks

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')


const { isSafeUrl } = require('@condo/domains/common/utils/url.utils')

const { SBBOL_SESSION_KEY } = require('./constants')
const sync = require('./sync')
const { getOnBoardingStatus } = require('./sync/getOnBoadringStatus')
const { initializeSbbolAuthApi } = require('./utils')
const { getSbbolUserInfoErrors } = require('./utils/getSbbolUserInfoErrors')

const logger = getLogger('sbbol/routes')

class SbbolRoutes {

    async startAuth (req, res, next) {
        const sbbolAuthApi = await initializeSbbolAuthApi()

        const redirectUrl = get(req, 'query.redirectUrl')
        if (redirectUrl && !isSafeUrl(redirectUrl)) throw new Error('redirectUrl is incorrect')
        // nonce: to prevent several callbacks from same request
        // state: to validate user browser on callback
        const checks = { nonce: generators.nonce(), state: generators.state() }
        req.session[SBBOL_SESSION_KEY] = { checks, redirectUrl }
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
            const checks = get(req, ['session', SBBOL_SESSION_KEY, 'checks'])
            if (!isObject(checks)) {
                logger.info({ msg: 'SBBOL invalid nonce and state', reqId })
                return res.status(400).send('ERROR: Invalid nonce and state')
            }

            // This is NOT a `TokenSet` record from our schema
            let tokenSet, userInfo

            try {
                tokenSet = await sbbolAuthApi.completeAuth(req, checks)
            } catch (err) {
                logger.error({ msg: 'SBBOL completeAuth error', err, reqId })
                throw err
            }

            try {
                const { access_token } = tokenSet
                userInfo = await sbbolAuthApi.fetchUserInfo(access_token)
            } catch (err) {
                logger.error({ msg: 'SBBOL completeAuth error', err, reqId })
                throw err
            }

            const errors = getSbbolUserInfoErrors(userInfo)
            if (errors.length) {
                logger.info({ msg: 'SBBOL invalid userinfo', data: { userInfo, errors }, reqId })
                return res.status(400).send(`ERROR: Invalid SBBOL userInfo: ${errors.join(';')}`)
            }

            const redirectUrl = get(req.session[SBBOL_SESSION_KEY], 'redirectUrl')

            const { keystone } = await getSchemaCtx('User')
            const {
                user,
                organization,
                organizationEmployee,
            } = await sync({ keystone, userInfo, tokenSet, reqId })
            await keystone._sessionManager.startAuthedSession(req, { item: { id: user.id }, list: keystone.lists['User'] })

            if (organizationEmployee) {
                res.cookie('organizationLinkId', organizationEmployee.id)
            }
            delete req.session[SBBOL_SESSION_KEY]
            await req.session.save()

            const { finished } = await getOnBoardingStatus(user)

            logger.info({ msg: 'SBBOL OK Authenticated', userId: user.id, organizationId: organization.id, employeeId: organizationEmployee.id, data: { finished } })
            if (redirectUrl) return res.redirect(redirectUrl)
            return res.redirect(finished ? '/' : '/onboarding')
        } catch (error) {
            logger.error({ msg: 'SBBOL auth-callback error', err: error, reqId })
            return next(error)
        }
    }
}

module.exports = {
    SbbolRoutes,
}
