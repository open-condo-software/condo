const { isObject, get } = require('lodash')
const { generators } = require('openid-client') // certified openid client will all checks

const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')


const { ORGANIZATION_TOUR } = require('@condo/domains/common/constants/featureflags')
const { isSafeUrl } = require('@condo/domains/common/utils/url.utils')

const { SBBOL_SESSION_KEY } = require('./constants')
const sync = require('./sync')
const { getOnBoardingStatus } = require('./sync/getOnBoadringStatus')
const { initializeSbbolAuthApi } = require('./utils')
const { getSbbolUserInfoErrors } = require('./utils/getSbbolUserInfoErrors')


const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}

const logger = getLogger('sbbol/routes')

class SbbolRoutes {
    async startAuth (req, res, next) {
        const reqId = req.id
        try {
            if (!SBBOL_AUTH_CONFIG.client_id) throw new Error('SBBOL_AUTH_CONFIG.client_id is not configured')
            const sbbolAuthApi = await initializeSbbolAuthApi()
            const query = get(req, 'query', {})
            const redirectUrl = get(query, 'redirectUrl')
            const queryFeatures = get(query, 'features', [])
            const useExtendedConfig = get(query, 'useExtendedConfig', false)
            const features = Array.isArray(queryFeatures) ? queryFeatures : [queryFeatures]

            if (redirectUrl && !isSafeUrl(redirectUrl)) throw new Error('redirectUrl is incorrect')
            // nonce: to prevent several callbacks from same request
            // state: to validate user browser on callback
            const checks = { nonce: generators.nonce(), state: generators.state() }
            req.session[SBBOL_SESSION_KEY] = { checks, redirectUrl, features }
            await req.session.save()
            const authUrl = sbbolAuthApi.authorizationUrlWithParams(checks, useExtendedConfig)
            return res.redirect(authUrl)
        } catch (error) {
            logger.error({ msg: 'SBBOL start-auth error', err: error, reqId })
            return next(error)
        }
    }

    async completeAuth (req, res, next) {
        const reqId = req.id
        try {
            if (!SBBOL_AUTH_CONFIG.client_id) throw new Error('SBBOL_AUTH_CONFIG.client_id is not configured')
            const sbbolAuthApi = await initializeSbbolAuthApi()
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
            const features = get(req.session[SBBOL_SESSION_KEY], 'features', [])

            const { keystone } = await getSchemaCtx('User')
            const {
                user,
                organization,
                organizationEmployee,
            } = await sync({ keystone, userInfo, tokenSet, reqId, features })
            await keystone._sessionManager.startAuthedSession(req, { item: { id: user.id }, list: keystone.lists['User'] })

            if (organizationEmployee) {
                res.cookie('organizationLinkId', organizationEmployee.id)
            }
            delete req.session[SBBOL_SESSION_KEY]
            await req.session.save()

            const { finished, created } = await getOnBoardingStatus(user)

            logger.info({ msg: 'SBBOL OK Authenticated', userId: user.id, organizationId: organization.id, employeeId: organizationEmployee.id, data: { finished } })
            if (redirectUrl) return res.redirect(redirectUrl)

            const isOrganizationTourEnabled = await featureToggleManager.isFeatureEnabled(keystone, ORGANIZATION_TOUR)

            return res.redirect(finished || !created || isOrganizationTourEnabled ? '/' : '/onboarding')
        } catch (error) {
            logger.error({ msg: 'SBBOL auth-callback error', err: error, reqId })
            return next(error)
        }
    }
}

module.exports = {
    SbbolRoutes,
}
