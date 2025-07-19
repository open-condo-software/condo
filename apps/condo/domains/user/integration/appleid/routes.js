const { isNil, get } = require('lodash')
const { generators } = require('openid-client')

const conf = require('@open-condo/config')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { APPLE_ID_SESSION_KEY } = require('@condo/domains/user/constants/common')
const { AppleIdIdentityIntegration } = require('@condo/domains/user/integration/appleid/AppleIdIdentityIntegration')
const { syncUser } = require('@condo/domains/user/integration/appleid/sync/syncUser')
const {
    getUserType,
    getRedirectUrl,
    getCode,
    getAllowRegistrationInterrupt,
    getAuthFlowId,
    getLinkingCode,
    getIdTokenByCode,
    getIdTokenByLinkingCode,
    interruptForRegistration,
    authorizeUser,
} = require('@condo/domains/user/integration/appleid/utils')
const { handleAuthRouteError } = require('@condo/domains/user/integration/utils/helper')

const APPLE_ID_CONFIG = conf.APPLE_ID_CONFIG ? JSON.parse(conf.APPLE_ID_CONFIG) : {}

// init constants
const integration = new AppleIdIdentityIntegration()

class AppleIdRoutes {
    async startAuth (req, res, next) {
        const redirectUrl = getRedirectUrl(req)
        try {
            if (!APPLE_ID_CONFIG.clientId) throw new Error('APPLE_ID_CONFIG.clientId is not configured')
            const userType = getUserType(req)
            const allowRegistrationInterrupt = getAllowRegistrationInterrupt(req)
            const authFlowId = getAuthFlowId(req)

            if (!allowRegistrationInterrupt && allowRegistrationInterrupt !== 'false') {
                throw new Error('Registration without interrupt is not supported yet')
            }

            if (!isNil(redirectUrl) && redirectUrl !== APPLE_ID_CONFIG.mobileRedirectUrl) {
                throw new Error('Provided redirectUrl is not allowed')
            }

            // clean state if anything exists in the session
            delete req.session[APPLE_ID_SESSION_KEY]

            // generate checks
            const checks = { nonce: generators.nonce(), state: generators.state() }

            // set session info
            req.session[APPLE_ID_SESSION_KEY] = { checks, redirectUrl, userType, authFlowId }
            await req.session.save()

            const authFormUrl = await integration.generateLoginFormParams(checks)
            return res.redirect(authFormUrl)
        } catch (error) {
            return handleAuthRouteError({
                redirectUrl,
                error,
                req,
                res,
                next,
            })
        }
    }

    async completeAuth (req, res, next) {
        const redirectUrl = getRedirectUrl(req)
        try {
            if (!APPLE_ID_CONFIG.clientId) throw new Error('APPLE_ID_CONFIG.clientId is not configured')
            const { keystone: context } = await getSchemaCtx('User')
            const userType = getUserType(req)
            const linkingCode = getLinkingCode(req)
            const code = getCode(req)

            // complete auth cases
            let idToken
            if (!isNil(code)) {
                // generic case when user's browser was redirected from Apple ID
                // and contains code & state parameters
                // idToken can be issued by /token endpoint
                idToken = await getIdTokenByCode(req)
            } else if (!isNil(linkingCode)) {
                // interrupted registration case
                // idToken was already issued and are living in the redis
                // we have to retrieve it and check that registration was started at the same device
                // by authFlowId parameter sent at the start and in this call
                idToken = await getIdTokenByLinkingCode(req)
            } else {
                throw new Error('AppleId completeAuth error: you have to specify either code or idToken')
            }

            // parse userInfo from idToken
            const userInfo = await integration.getUserInfo({ idToken })

            // sync user
            const syncUserResult = await syncUser({
                context,
                userInfo,
                userType,
                authedUserId: get(req, 'user.id'),
            })

            if (isNil(get(syncUserResult, 'id'))) {
                // registration required case
                // we have to respond with linkingCode in order to interrupt for registration process
                return await interruptForRegistration(req, res, idToken)
            } else {
                // authorize user
                return await authorizeUser(req, res, context, syncUserResult.id)
            }
        } catch (error) {
            return handleAuthRouteError({
                redirectUrl,
                error,
                req,
                res,
                next,
            })
        }
    }
}

module.exports = {
    AppleIdRoutes,
}