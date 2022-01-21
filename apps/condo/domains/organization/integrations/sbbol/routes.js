const { isObject } = require('lodash')
const { generators } = require('openid-client') // certified openid client will all checks

const { getSchemaCtx } = require('@core/keystone/schema')
const conf = require('@core/config')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}
const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}

const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { DEVELOPER_IMPORTANT_NOTE_TYPE } = require('@condo/domains/notification/constants/constants')

const { getSbbolUserInfoErrors, SBBOL_SESSION_KEY } = require('./common')
const { SbbolOauth2Api } = require('./oauth2')
const sync = require('./sync')
const { getOnBoardingStatus } = require('./sync/getOnBoadringStatus')
const { dvSenderFields } = require('./constants')
const { getOrganizationAccessToken } = require('./accessToken')

const DEVELOPER_EMAIL = conf.DEVELOPER_EMAIL

async function sendToDeveloper (type, data) {
    if (DEVELOPER_EMAIL) {
        const { keystone } = await getSchemaCtx('Message')
        await sendMessage(keystone, {
            ...dvSenderFields,
            to: { email: DEVELOPER_EMAIL },
            lang: 'en',
            type: DEVELOPER_IMPORTANT_NOTE_TYPE,
            meta: { dv: 1, type, data },
        })
    }
}

class SbbolRoutes {

    async initialize () {
        let tokenSet
        try {
            const result = await getOrganizationAccessToken(SBBOL_FINTECH_CONFIG.service_organization_hashOrgId)
            tokenSet = result.tokenSet
        } catch (e) {
            if (!e.message.match('[tokens:expired]')) {
                throw e
            }
        }

        // In case when we we have not logged in using partner account in SBBOL, take the value from environment
        const clientSecret = tokenSet && tokenSet.clientSecret ? tokenSet.clientSecret : SBBOL_AUTH_CONFIG.client_secret

        this.helper = new SbbolOauth2Api({
            clientSecret,
        })
        this.initialized = true
    }

    async startAuth (req, res, next) {
        if (!this.initialized) {
            await this.initialize()
        }
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

            // This is NOT a `TokenSet` record from our schema
            const tokenSet = await this.helper.completeAuth(req, req.session[SBBOL_SESSION_KEY])
            const { keystone } = await getSchemaCtx('User')
            const { access_token } = tokenSet
            const userInfo = await this.helper.fetchUserInfo(access_token)
            const errors = getSbbolUserInfoErrors(userInfo)
            if (errors.length) {
                await sendToDeveloper('SBBOL_INVALID_USERINFO', { userInfo, errors })
                return res.status(400).send(`ERROR: Invalid SBBOL userInfo: ${errors.join(';')}`)
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
