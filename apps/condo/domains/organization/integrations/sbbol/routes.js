const { isObject } = require('lodash')
const { generators } = require('openid-client') // certified openid client will all checks

const { getSchemaCtx } = require('@condo/keystone/schema')
const conf = require('@condo/config')

const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { DEVELOPER_IMPORTANT_NOTE_TYPE } = require('@condo/domains/notification/constants/constants')

const { getSbbolUserInfoErrors, SBBOL_SESSION_KEY } = require('./common')
const sync = require('./sync')
const { getOnBoardingStatus } = require('./sync/getOnBoadringStatus')
const { dvSenderFields } = require('./constants')
const { initializeSbbolAuthApi } = require('./utils')

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
        const sbbolAuthApi = await initializeSbbolAuthApi()
        try {
            if (!isObject(req.session[SBBOL_SESSION_KEY])) {
                return res.status(400).send('ERROR: Invalid nonce and state')
            }

            // This is NOT a `TokenSet` record from our schema
            const tokenSet = await sbbolAuthApi.completeAuth(req, req.session[SBBOL_SESSION_KEY])
            const { keystone } = await getSchemaCtx('User')
            const { access_token } = tokenSet
            const userInfo = await sbbolAuthApi.fetchUserInfo(access_token)
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
