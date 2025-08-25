const { isObject, get } = require('lodash')
const { generators } = require('openid-client') // certified openid client will all checks

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { isSafeUrl } = require('@condo/domains/common/utils/url.utils')

const { SBBOL_SESSION_KEY } = require('./constants')
const sync = require('./sync')
const { initializeSbbolAuthApi } = require('./utils')
const { getSbbolUserInfoErrors } = require('./utils/getSbbolUserInfoErrors')


const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}
const SBBOL_AUTH_CONFIG_EXTENDED = conf.SBBOL_AUTH_CONFIG_EXTENDED ? JSON.parse(conf.SBBOL_AUTH_CONFIG_EXTENDED) : {}

const logger = getLogger('sbbol-routes')

class SbbolRoutes {
    async startAuth (req, res, next) {
        if (!SBBOL_AUTH_CONFIG.client_id) throw new Error('SBBOL_AUTH_CONFIG.client_id is not configured')
        if (!SBBOL_AUTH_CONFIG_EXTENDED.client_id) throw new Error('SBBOL_AUTH_CONFIG_EXTENDED.client_id is not configured')
        const query = get(req, 'query', {})
        const redirectUrl = get(query, 'redirectUrl')
        if (redirectUrl && !isSafeUrl(redirectUrl)) throw new Error('redirectUrl is incorrect')
        try {
            const queryFeatures = get(query, 'features', [])
            const useExtendedConfig = get(query, 'useExtendedConfig', false)
            const sbbolAuthApi = await initializeSbbolAuthApi(useExtendedConfig)
            const features = Array.isArray(queryFeatures) ? queryFeatures : [queryFeatures]
            // nonce: to prevent several callbacks from same request
            // state: to validate user browser on callback
            const checks = { nonce: generators.nonce(), state: generators.state() }
            req.session[SBBOL_SESSION_KEY] = { checks, redirectUrl, features, useExtendedConfig }
            await req.session.save()
            const authUrl = sbbolAuthApi.authorizationUrlWithParams(checks)
            return res.redirect(authUrl)
        } catch (err) {
            logger.error({ msg: 'SBBOL start-auth error', err })
            return next(err)
        }
    }

    async completeAuth (req, res, next) {
        if (!SBBOL_AUTH_CONFIG.client_id) throw new Error('SBBOL_AUTH_CONFIG.client_id is not configured')
        if (!SBBOL_AUTH_CONFIG_EXTENDED.client_id) throw new Error('SBBOL_AUTH_CONFIG_EXTENDED.client_id is not configured')
        const reqId = req.id
        try {
            const checks = get(req, ['session', SBBOL_SESSION_KEY, 'checks'])
            if (!isObject(checks)) {
                logger.info({ msg: 'SBBOL invalid nonce and state' })
                return res.status(400).send('ERROR: Invalid nonce and state')
            }
            const useExtendedConfig = get(req, ['session', SBBOL_SESSION_KEY, 'useExtendedConfig'], false)
            const sbbolAuthApi = await initializeSbbolAuthApi(useExtendedConfig)

            // This is NOT a `TokenSet` record from our schema
            let tokenSet, userInfo

            try {
                tokenSet = await sbbolAuthApi.completeAuth(req, checks)
            } catch (err) {
                logger.error({ msg: 'SBBOL completeAuth error', err })
                throw err
            }

            try {
                const { access_token } = tokenSet
                userInfo = await sbbolAuthApi.fetchUserInfo(access_token)
            } catch (err) {
                logger.error({ msg: 'SBBOL completeAuth error', err })
                throw err
            }

            const errors = getSbbolUserInfoErrors(userInfo)
            if (errors.length) {
                logger.info({ msg: 'SBBOL invalid userinfo', data: { userInfo, errors } })
                return res.status(400).send(`ERROR: Invalid SBBOL userInfo: ${errors.join(';')}`)
            }

            const redirectUrl = get(req.session[SBBOL_SESSION_KEY], 'redirectUrl')
            const features = get(req.session[SBBOL_SESSION_KEY], 'features', [])

            const { keystone } = getSchemaCtx('User')
            const {
                user,
                organization,
                organizationEmployee,
            } = await sync({ keystone, userInfo, tokenSet, reqId, features, useExtendedConfig })
            await keystone._sessionManager.startAuthedSession(req, {
                item: { id: user.id },
                list: keystone.lists['User'],
                meta: {
                    source: 'auth-integration',
                    provider: 'sbbol',
                },
            })
            if (organizationEmployee) {
                res.cookie('organizationLinkId', organizationEmployee.id)
            }
            delete req.session[SBBOL_SESSION_KEY]
            await req.session.save()

            logger.info({
                msg: 'SBBOL OK Authenticated',
                data: { userId: user.id, organizationId: organization.id, employeeId: organizationEmployee.id },
            })
            if (redirectUrl) return res.redirect(redirectUrl)
            return res.redirect('/tour')
        } catch (error) {
            logger.error({ msg: 'SBBOL auth-callback error', err: error })
            return next(error)
        }
    }
}

module.exports = {
    SbbolRoutes,
}
