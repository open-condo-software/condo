const { isObject, get, isNil } = require('lodash')
const jwtDecode = require('jwt-decode')
const { generators } = require('openid-client')
const { v4: uuid } = require('uuid')

const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { getOnBoardingStatus } = require('@condo/domains/organization/integrations/sbbol/sync/getOnBoadringStatus')
const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')

const {
    User,
    UserExternalIdentity,
} = require('@condo/domains/user/utils/serverSchema')
const { RESIDENT, SBER_ID_SESSION_KEY, SBER_ID_IDP_TYPE } = require('@condo/domains/user/constants/common')

const { SberIdIdentityIntegration } = require('@condo/domains/user/integration/sberid/SberIdIdentityIntegration')
const { syncUser } = require('@condo/domains/user/integration/sberid/sync/syncUser')
const {
    getRedirectUrl,
    getUserType,
    validateState,
    validateNonce,
} = require('@condo/domains/user/integration/sberid/utils')


// init constants
const dv = 1
const sender = { dv, fingerprint: 'user-external-identity-router' }
const integration = new SberIdIdentityIntegration()

class SberIdRoutes {
    async startAuth (req, res, next) {
        try {
            const redirectUrl = getRedirectUrl(req)
            const userType = getUserType(req)

            // clean state if anything exists in the session
            delete req.session[SBER_ID_SESSION_KEY]

            // generate checks
            const checks = { nonce: generators.nonce(), state: generators.state() }

            // set session info
            req.session[SBER_ID_SESSION_KEY] = { checks, redirectUrl, userType }
            await req.session.save()

            const authFormUrl = await integration.generateLoginFormParams(checks)
            return res.redirect(authFormUrl)
        } catch (error) {
            return next(error)
        }
    }

    async completeAuth (req, res, next) {
        try {
            const { keystone: context } = await getSchemaCtx('User')
            const userType = getUserType(req)

            // validate state parameter
            validateState(req)

            // getting tokenSet from user external provider
            const tokenSet = await integration.issueExternalIdentityToken(req.query)

            // validate nonce
            validateNonce(req, tokenSet)

            // getting user info
            const userInfo = await integration.getUserInfo(tokenSet)

            // sync user
            const { id } = await syncUser({ context, userInfo, userType })

            // authorize user
            return await this.authorizeUser(req, res, context, id)
        } catch (error) {
            return next(error)
        }
    }

    async authorizeUser (req, res, context, userId) {
        // get redirectUrl params
        const redirectUrl = getRedirectUrl(req)

        // auth session
        const user = await User.getOne(context, { id: userId })
        const { keystone } = await getSchemaCtx('User')
        const token = await keystone._sessionManager.startAuthedSession(req, { item: { id: user.id }, list: keystone.lists['User'] })

        // remove tmp data
        delete req.session[SBER_ID_SESSION_KEY]
        await req.session.save()

        // get on boarding status
        const { finished } = await getOnBoardingStatus(user)

        // redirect
        if (isNil(redirectUrl) && RESIDENT === user.type) {
            // resident entry page
            return res.redirect('https://doma.ai/app_landing')
        } else if (isNil(redirectUrl)) {
            // staff entry page
            return res.redirect(finished ? '/' : '/onboarding')
        } else {
            // specified redirect page (mobile app case)
            const link = new URL(redirectUrl)
            link.searchParams.set('onBoardingFinished', finished)
            link.searchParams.set('token', token)

            return res.redirect(link)
        }
    }
}

module.exports = {
    SberIdRoutes,
}