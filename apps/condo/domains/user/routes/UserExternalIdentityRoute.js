const { isObject, get, isNil } = require('lodash')
const jwtDecode = require('jwt-decode')
const { generators } = require('openid-client')
const { v4: uuid } = require('uuid')

const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { getOnBoardingStatus } = require('@condo/domains/organization/integrations/sbbol/sync/getOnBoadringStatus')
const { isSafeUrl } = require('@condo/domains/common/utils/url.utils')
const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')

const { getIdentityIntegration } = require('@condo/domains/user/integration/identity')
const {
    User,
    UserExternalIdentity,
} = require('@condo/domains/user/utils/serverSchema')
const { USER_EXTERNAL_IDENTITY_AUTH_SESSION_KEY } = require('@condo/domains/user/constants/links')
const { RESIDENT, USER_TYPES } = require('@condo/domains/user/constants/common')

// init constants
const sender = { dv: 1, fingerprint: 'user-external-identity-router' }

class UserExternalIdentityRoute {
    async getContext () {
        const { keystone: context } = await getSchemaCtx('UserExternalIdentity')
        return context
    }

    async startAuth (req, res, next) {
        try {
            const integration = this.getIntegration(req)
            const redirectUrl = this.getRedirectUrl(req)
            const userType = this.getUserType(req)

            // clean state if anything exists in the session
            delete req.session[USER_EXTERNAL_IDENTITY_AUTH_SESSION_KEY]

            // generate checks
            const checks = { nonce: generators.nonce(), state: generators.state() }

            // set session info
            req.session[USER_EXTERNAL_IDENTITY_AUTH_SESSION_KEY] = { checks, redirectUrl, userType }
            await req.session.save()

            const authFormUrl = await integration.generateLoginFormParams(checks)
            return res.redirect(authFormUrl)
        } catch (error) {
            return next(error)
        }
    }

    async completeAuth (req, res, next) {
        try {
            const context = await this.getContext()
            const integration = this.getIntegration(req)
            const identityType = integration.getType()
            const userType = this.getUserType(req)

            // validate state parameter
            this.validateState(req)

            // getting tokenSet from user external provider
            const tokenSet = await integration.issueExternalIdentityToken(req.query)

            // validate nonce
            this.validateNonce(req, tokenSet)

            // getting user info
            const userInfo = await integration.getUserInfo(tokenSet)

            // try to find linked identities
            const userIdentities = await UserExternalIdentity.getAll(context, {
                identityType,
                identityId: userInfo.id,
            })

            // now we have the following cases:
            // 1. user already registered and have linked identity
            // 2. user already registered and have no linked identity
            // 3. user not registered

            // case 1: user already registered and have linked identity
            if (userIdentities.length > 0) {
                const [identity] = userIdentities
                const { user: { id: userId } } = identity
                return await this.authorizeUser(req, res, context, userId)
            }

            // case 2: user already registered and have no linked identity
            const existed = await User.getOne(context, {
                phone: normalizePhone(userInfo.phoneNumber), type: userType,
            })
            if (existed) {
                // proceed link & auth
                return await this.linkUser(req, res, context, existed, userInfo, identityType)
            }

            // 3. user not registered
            return await this.registerUser(req, res, context, userInfo, identityType, userType)
        } catch (error) {
            return next(error)
        }
    }

    async registerUser (req, res, context, userInfo, identityType, userType) {
        // prepare data
        const normalizedPhone = normalizePhone(userInfo.phoneNumber)
        const normalizedEmail = normalizeEmail(userInfo.email)
        const password = uuid()

        // validate that email is not picked up
        const existed = await User.getOne(context, { email: normalizedEmail, type: userType })
        if (existed) {
            throw new Error(`User with email ${normalizedEmail} already exists`)
        }

        // use email to prefil name
        const name = normalizedEmail.split('@')[0]

        // prepare userData
        const userData = {
            name,
            password,
            email: normalizedEmail,
            phone: normalizedPhone,
            isPhoneVerified: true,
            isEmailVerified: true,
            type: userType,
            sender,
            dv: sender.dv,
        }

        // create user
        const user = await User.create(context, userData)

        // proceed link & auth
        return await this.linkUser(req, res, context, user, userInfo, identityType)
    }

    async linkUser (req, res, context, user, userInfo, identityType) {
        await UserExternalIdentity.create(context, {
            dv: sender.dv,
            sender,
            user: { connect: { id: user.id } },
            identityId: userInfo.id,
            identityType: identityType,
            meta: userInfo,
        })

        return await this.authorizeUser(req, res, context, user.id)
    }

    async authorizeUser (req, res, context, userId) {
        // get redirectUrl params
        const redirectUrl = this.getRedirectUrl(req)

        // auth session
        const user = await User.getOne(context, { id: userId })
        const { keystone } = await getSchemaCtx('User')
        const token = await keystone._sessionManager.startAuthedSession(req, { item: { id: user.id }, list: keystone.lists['User'] })

        // remove tmp data
        delete req.session[USER_EXTERNAL_IDENTITY_AUTH_SESSION_KEY]
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

    getIntegration (req) {
        const { type: identityType } = req.params

        // get and validate integration
        const integration = getIdentityIntegration(identityType)
        if (isNil(integration)) throw new Error('integration type is incorrect')

        return integration
    }

    getRedirectUrl (req) {
        // get and validate redirect url
        const redirectUrl = get(req, 'query.redirectUrl') || this.getSessionParam(req, 'redirectUrl')
        if (redirectUrl && !isSafeUrl(redirectUrl)) throw new Error('redirectUrl is incorrect')
        return redirectUrl
    }

    getUserType (req) {
        // get and validate user type
        let userType = RESIDENT
        const userTypeQP = get(req, 'query.userType')
        const userTypeSessionParam = this.getSessionParam(req, 'userType')
        if (!isNil(userTypeQP)) {
            if (!USER_TYPES.includes(userTypeQP)) throw new Error('userType is incorrect')
            userType = userTypeQP
        } else if (!isNil(userTypeSessionParam)) {
            userType = userTypeSessionParam
        }

        return userType
    }

    validateState (req) {
        const state = this.getSessionParam(req, 'checks.state')
        const stateQP = get(req, 'query.state')

        // validate that state in session are same as in the QP
        // in case if session state is empty - the app2app flow are used - no checks possible for state parameter
        if (!isNil(state) && state !== stateQP) throw new Error('state is incorrect')
    }

    validateNonce (req, tokenSet) {
        const { idToken } = tokenSet
        const {  nonce } = jwtDecode(idToken)
        const nonceOriginal =  this.getSessionParam(req, 'checks.nonce') || get(req, 'query.nonce')

        if (nonceOriginal !== nonce) throw new Error('nonce is incorrect')
    }

    getSessionParam (req, path) {
        if (isObject(req.session) && isObject(req.session[USER_EXTERNAL_IDENTITY_AUTH_SESSION_KEY])) {
            return get(req.session[USER_EXTERNAL_IDENTITY_AUTH_SESSION_KEY], path)
        }
    }
}

module.exports = {
    UserExternalIdentityRoute,
}