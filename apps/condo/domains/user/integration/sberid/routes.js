const { isNil } = require('lodash')
const { generators } = require('openid-client')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { RESIDENT, SBER_ID_SESSION_KEY } = require('@condo/domains/user/constants/common')
const { SberIdIdentityIntegration } = require('@condo/domains/user/integration/sberid/SberIdIdentityIntegration')
const { syncUser } = require('@condo/domains/user/integration/sberid/sync/syncUser')
const {
    getRedirectUrl,
    getUserType,
    validateState,
    validateNonce,
    hasSamePhone,
} = require('@condo/domains/user/integration/sberid/utils')
const {
    User,
} = require('@condo/domains/user/utils/serverSchema')


const SBER_ID_CONFIG = conf.SBER_ID_CONFIG ? JSON.parse(conf.SBER_ID_CONFIG) : {}

// init constants
const integration = new SberIdIdentityIntegration()
const logger = getLogger()

class SberIdRoutes {
    async startAuth (req, res, next) {
        try {
            if (!SBER_ID_CONFIG.clientId) throw new Error('SBER_ID_CONFIG.clientId is not configured')
            const redirectUrl = getRedirectUrl(req)
            const userType = getUserType(req)

            // clean state if anything exists in the session
            delete req.session[SBER_ID_SESSION_KEY]

            // generate checks
            const checks = { nonce: generators.nonce(), state: generators.state() }

            // set session info
            req.session[SBER_ID_SESSION_KEY] = { checks, redirectUrl, userType }
            await req.session.save()

            const authFormUrl = await integration.generateLoginFormParams(checks, redirectUrl)
            return res.redirect(authFormUrl)
        } catch (error) {
            return next(error)
        }
    }

    async completeAuth (req, res, next) {
        try {
            if (!SBER_ID_CONFIG.clientId) throw new Error('SBER_ID_CONFIG.clientId is not configured')
            const { keystone: context } = await getSchemaCtx('User')
            const redirectUrl = getRedirectUrl(req)
            const userType = getUserType(req)

            // validate state parameter
            validateState(req)

            // getting tokenSet from user external provider
            let tokenSet, userInfo
            try {
                tokenSet = await integration.issueExternalIdentityToken(req.query.code, redirectUrl)
            } catch (err) {
                logger.error({ msg: 'SberId completeAuth error', err })
                throw err
            }

            // validate nonce
            validateNonce(req, tokenSet)

            // getting user info
            try {
                userInfo = await integration.getUserInfo(tokenSet)
            } catch (err) {
                logger.error({ msg: 'SberId completeAuth error', err })
                throw err
            }

            // getting current user
            // for linking checks case (user.phone != sberId.phoneNumber)
            if (req.user && !hasSamePhone(req.user, userInfo)) {
                return res.status(400).json({
                    code: 'AUTH_ERROR_DIFFERENT_PHONE_NUMBERS',
                })
            }

            // sync user
            const { id } = await syncUser({ context, userInfo, userType })

            // authorize user
            return await this.authorizeUser(req, res, context, id)
        } catch (error) {
            logger.error({ msg: 'SberId auth-callback error', err: error })
            return next(error)
        }
    }

    async authorizeUser (req, res, context, userId) {
        // get redirectUrl params
        const redirectUrl = getRedirectUrl(req)

        // auth session
        const user = await User.getOne(context, { id: userId }, 'id type')
        const { keystone } = getSchemaCtx('User')
        const token = await keystone._sessionManager.startAuthedSession(req, {
            item: { id: user.id },
            list: keystone.lists['User'],
            meta: {
                source: 'auth-integration',
                provider: 'sber-id',
            },
        })

        // remove tmp data
        delete req.session[SBER_ID_SESSION_KEY]
        await req.session.save()

        // redirect
        if (isNil(redirectUrl) && RESIDENT === user.type) {
            // resident entry page
            return res.redirect(SBER_ID_CONFIG.residentRedirectUri || '/')
        } else if (isNil(redirectUrl)) {
            // staff entry page
            return res.redirect('/tour')
        } else {
            // specified redirect page (mobile app case)
            const link = new URL(redirectUrl)
            link.searchParams.set('token', token)

            return res.redirect(link)
        }
    }
}

module.exports = {
    SberIdRoutes,
}