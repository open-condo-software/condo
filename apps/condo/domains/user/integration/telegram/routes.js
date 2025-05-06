const { isNil } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { RESIDENT } = require('@condo/domains/user/constants/common')
const { syncUser } = require('@condo/domains/user/integration/telegram/sync/syncUser')
const {
    getRedirectUrl,
    getUserType,
} = require('@condo/domains/user/integration/telegram/utils/params')
const { validateTgAuthData } = require('@condo/domains/user/integration/telegram/utils/validations')
const {
    User,
} = require('@condo/domains/user/utils/serverSchema')

const { ERROR_MESSAGES } = require('./utils/errors')

class TelegramOauthRoutes {

    constructor (name, botToken, redirectUrls = [], allowedUserTypes = [], residentRedirectUri = '/') {
        this.botToken = botToken
        this.redirectUrls = redirectUrls
        this.allowedUserTypes = allowedUserTypes
        this.residentRedirectUri = residentRedirectUri
        this.logger = getLogger(`telegram-oauth/${name}/routes`)
    }

    async completeAuth (req, res, next) {
        const reqId = req.id
        try {
            const { keystone: context } = await getSchemaCtx('User')
            const redirectUrl = getRedirectUrl(req)
            const userType = getUserType(req)

            if (redirectUrl && !this.redirectUrls.includes(redirectUrl)) {
                return this._error400(res, ERROR_MESSAGES.INVALID_REDIRECT_URL, reqId)
            }

            // normally here is different bots for residents and staff with different ui
            if (!this.allowedUserTypes.includes(userType)) {
                return this._error400(res, ERROR_MESSAGES.NOT_SUPPORTED_USER_TYPE, reqId)
            }

            const tgAuthData = req.body
            if (!tgAuthData) {
                return this._error400(res, ERROR_MESSAGES.BODY_MISSING, reqId)
            }

            const validationError = validateTgAuthData(tgAuthData, this.botToken)
            if (validationError) {
                return this._error400(res, validationError, reqId)
            }
            tgAuthData.id = String(tgAuthData.id)
            // sync user
            const { id, error } = await syncUser({ authenticatedUser: req.user, context, userInfo: tgAuthData, userType })
            if (error) {
                return this._error400(res, error, reqId)
            }

            // authorize user
            return await this.authorizeUser(req, res, context, id)
        } catch (error) {
            this.logger.error({ msg: 'TelegramOauth auth-callback error', err: error, reqId })
            return next(error)
        }
    }

    async authorizeUser (req, res, context, userId) {
        // get redirectUrl params
        const redirectUrl = getRedirectUrl(req)

        // auth session
        const user = await User.getOne(context, { id: userId }, 'id type')
        if (user.isSupport || user.isAdmin) {
            return this._error400(res, ERROR_MESSAGES.SUPER_USERS_NOT_ALLOWED, req.id)
        }
        const { keystone } = await getSchemaCtx('User')
        const token = await keystone._sessionManager.startAuthedSession(req, { item: { id: user.id }, list: keystone.lists['User'] })

        // redirect
        if (isNil(redirectUrl) && RESIDENT === user.type) {
            // resident entry page
            return res.redirect(this.residentRedirectUri)
        } else if (isNil(redirectUrl)) {
            // staff entry page
            return res.redirect('/tour')
        } else {
            // specified redirect page (mobile case)
            const link = new URL(redirectUrl)
            link.searchParams.set('token', token)

            return res.redirect(link)
        }
    }

    _error400 (res, errorMessage, reqId, extraData) {
        this.logger.error({ msg: 'TelegramOauth error', reqId, data: { message: errorMessage, extra: extraData } })
        return res.status(400).json({ error: errorMessage, extra: extraData })
    }
}

module.exports = {
    TelegramOauthRoutes,
}