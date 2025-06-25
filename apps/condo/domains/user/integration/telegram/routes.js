const { isNil } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { STAFF } = require('@condo/domains/user/constants/common')
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
const { parseBotId, getBotId } = require('./utils/params')
const { validateOauthConfig, isValidMiniAppInitParams, validateState, validateNonce } = require('./utils/validations')

const { TELEGRAM_ID_SESISION_KEY } = require('../../constants/common')
const {getIdentity} = require("./sync/syncUser");

const logger = getLogger('telegram-oauth/routes')

class BotsConfigProvider {
    isValid
    validationError
    configs = {}
    constructor () {
        this.isValid = true
        try {
            const TELEGRAM_OAUTH_CONFIG = JSON.parse(conf.TELEGRAM_OAUTH_CONFIG || '[]')
            TELEGRAM_OAUTH_CONFIG.forEach(conf => conf.botId = parseBotId(conf.botToken))
            validateOauthConfig(TELEGRAM_OAUTH_CONFIG)
            for (const config of TELEGRAM_OAUTH_CONFIG) {
                this.configs[config.botId] = config
            }
        } catch (err) {
            logger.error({ msg: 'Telegram oauth config error', err })
            this.isValid = false
            this.validationError = err
        }
    }

    isValidBotId (botId) {
        return !!this.configs[botId]
    }

    getConfig (botId) {
        return this.configs[botId]
    }
}

class TelegramOauthRoutes {
    /** @type {BotsConfigProvider} */
    _provider

    constructor () {
        this._provider = new BotsConfigProvider()
    }

    async startAuth (req, res, next) {
        const reqId = req.id
        // clean state if anything exists in the session
        //delete req.session[TELEGRAM_ID_SESISION_KEY]
        try {
            this._validateBotId(req, res, next)
            validateState(req)
            if (!req.query.nonce) {
                throw new Error('No nonce')
            }
            const userType = getUserType(req)
            const tgAuthData = this._getTgAuthData(req, res)
            const { keystone: context } = await getSchemaCtx('User')
            const identity = await getIdentity(context, tgAuthData, userType)
            if (identity) {
                return res.redirect(`${conf.SERVER_URL}/api/tg/${getBotId(req)}/callback`)
            }
            if (!req.user || req.user.type !== userType) {
                return res.redirect('/auth')
            }
            const { id, error } = await syncUser({ authenticatedUser: req.user, context, userInfo: tgAuthData, userType })
            if (error) {
                return this._error400(res, error, reqId)
            }
        } catch (err) {
            logger.error({ msg: 'Telegram oauth startAuth', err, reqId })
        }
    }

    async completeAuth (req, res, next) {
        const reqId = req.id
        try {
            this._validateBotId(req, res, next)
            const botId = getBotId(req)
            const config = this._provider.getConfig(botId)
            const { keystone: context } = await getSchemaCtx('User')
            const redirectUrl = getRedirectUrl(req)
            const userType = getUserType(req)

            if (userType !== STAFF && (!redirectUrl || !config.allowedRedirectUrls.includes(redirectUrl))) {
                return this._error400(res, ERROR_MESSAGES.INVALID_REDIRECT_URL, reqId)
            }

            if (!config.allowedUserType || !userType || config.allowedUserType !== userType) {
                return this._error400(res, ERROR_MESSAGES.NOT_SUPPORTED_USER_TYPE, reqId)
            }

            const tgAuthData = this._getTgAuthData(req, res)
            // sync user


            // authorize user
            return await this.authorizeUser(req, res, context, id)
        } catch (error) {
            logger.error({ msg: 'TelegramOauth auth-callback error', err: error, reqId })
            return next(error)
        }
    }

    async authorizeUser (req, res, context, userId) {
        // get redirectUrl params
        const redirectUrl = getRedirectUrl(req)

        // auth session
        const user = await User.getOne(context, { id: userId }, 'id type isSupport isAdmin')
        if (user.isSupport || user.isAdmin) {
            return this._error400(res, ERROR_MESSAGES.SUPER_USERS_NOT_ALLOWED, req.id)
        }
        const { keystone } = await getSchemaCtx('User')
        const token = await keystone._sessionManager.startAuthedSession(req, { item: { id: user.id }, list: keystone.lists['User'] })

        // redirect
        if (isNil(redirectUrl)) {
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
        logger.error({ msg: 'TelegramOauth error', reqId, data: { message: errorMessage, extra: extraData } })
        return res.status(400).json({ error: errorMessage, extra: extraData })
    }
    
    _validateBotId (req, res, next) {
        if (!this._provider.isValid) {
            logger.error({ msg: 'Can\'t auth, config is not valid', reqId: req.id, data: { validationError: this._provider.validationError } })
            return res.sendStatus(503)
        }
        try {
            const botId = getBotId(req)
            if (!this._provider.isValidBotId(botId)) {
                return this._error400(res, ERROR_MESSAGES.INVALID_BOT_ID, req.id)
            }
        }
        catch (error) {
            logger.error({ msg: 'TelegramOauth auth-callback error', err: error, reqId: req.id })
            return next(error)
        }
    }

    _getTgAuthData (req, res) {
        const config = this._provider.getConfig(getBotId(req))
        let tgAuthData = req.body
        if (!tgAuthData) {
            return this._error400(res, ERROR_MESSAGES.BODY_MISSING, req.id)
        }
        const validationError = validateTgAuthData(tgAuthData, config.botToken)
        if (validationError) {
            return this._error400(res, validationError, req.id)
        }
        if (isValidMiniAppInitParams(tgAuthData)) {
            // Note: we need only "id" from tgAuthData, but better keep info for meta
            tgAuthData = { ...JSON.parse(tgAuthData.user), ...tgAuthData }
        }
        tgAuthData.id = String(tgAuthData.id)
        return tgAuthData
    }
}

module.exports = {
    TelegramOauthRoutes,
}