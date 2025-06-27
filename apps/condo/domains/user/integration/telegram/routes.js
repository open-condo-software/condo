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

const { getIdentity } = require('./sync/syncUser')
const { ERROR_MESSAGES } = require('./utils/errors')
const { parseBotId, getBotId } = require('./utils/params')
const { validateOauthConfig, isValidMiniAppInitParams, validateState, validateNonce } = require('./utils/validations')

const { TELEGRAM_ID_SESISION_KEY } = require('../../constants/common')

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
        debugger
        try {
            this._validateBotId(req, res, next)
            validateState(req)
            if (!req.query.nonce) {
                throw new Error('No nonce')
            }
            const userType = getUserType(req)
            const { tgAuthData } = this._getTgAuthData(req, res)
            const { keystone: context } = await getSchemaCtx('User')
            const identity = await getIdentity(context, tgAuthData, userType)
            const callbackUrl = this._buildUrlWithParams(`${conf.SERVER_URL}/api/tg/${getBotId(req)}/auth/callback`, {
                ...req.query,
                redirectUrl: encodeURIComponent(req.query.redirectUrl),
                tgAuthData: req.query.tgAuthData,
            })
            if (identity) {
                return res.redirect(callbackUrl)
            }
            if (!req.user || req.user.type !== userType) {
                const returnToUrl = `${conf.SERVER_URL}${req.url}?${callbackUrl.searchParams.toString()}`
                return res.redirect(`/auth?next=${encodeURIComponent(returnToUrl)}`)
            }
            return res.redirect(callbackUrl)
        } catch (err) {
            logger.error({ msg: 'Telegram oauth startAuth', err, reqId })
            return next(err)
        }
    }

    async completeAuth (req, res, next) {
        const reqId = req.id
        debugger
        try {
            this._validateBotId(req, res, next)
            validateState(req)
            if (!req.query.nonce) {
                throw new Error('No nonce')
            }

            // const botId = getBotId(req)
            // const config = this._provider.getConfig(botId)
            const { keystone: context } = await getSchemaCtx('User')
            const redirectUrl = getRedirectUrl(req)
            const userType = getUserType(req)
            //
            // if (userType !== STAFF && (!redirectUrl || !config.allowedRedirectUrls.includes(redirectUrl))) {
            //     return this._error(res, ERROR_MESSAGES.INVALID_REDIRECT_URL, reqId)
            // }
            //
            // if (!config.allowedUserType || !userType || config.allowedUserType !== userType) {
            //     return this._error(res, ERROR_MESSAGES.NOT_SUPPORTED_USER_TYPE, reqId)
            // }
            //
            const { tgAuthData } = this._getTgAuthData(req, res)
            // sync user
            const { id, error } = await syncUser({ authenticatedUser: req.user, userInfo: tgAuthData, context, userType })
            if (error) {
                return this._error(res, error, reqId)
            }
            // authorize user
            await this.authorizeUser(req, res, context, id)
            const params = {
                ...req.query,
                tgAuthData: JSON.stringify(this._getTgAuthData(req, res).initialTgAuthData),
                client_id: 'tg-auth',
                response_type: 'code',
                redirect_uri: decodeURIComponent(redirectUrl),
                scope: 'openid',
            }
            delete params.redirectUrl
            console.error('OIDC REDIRECT ', params.redirect_uri)
            const oidcUrl = this._buildUrlWithParams(`${conf.SERVER_URL}/oidc/auth`, params)
            console.error('OIDC REDIRECT ', oidcUrl)
            return res.redirect(oidcUrl)
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
            return this._error(res, ERROR_MESSAGES.SUPER_USERS_NOT_ALLOWED, req.id)
        }
        const { keystone } = await getSchemaCtx('User')
        await keystone._sessionManager.startAuthedSession(req, { item: { id: user.id }, list: keystone.lists['User'] })
        await req.session.save()
    }

    _error (res, error, reqId, extraData) {
        logger.error({ msg: 'TelegramOauth error', reqId, data: { error, extra: extraData } })
        return res.status(error.status || 400).json({ error, extra: extraData })
    }
    
    _validateBotId (req, res, next) {
        if (!this._provider.isValid) {
            logger.error({ msg: 'Can\'t auth, config is not valid', reqId: req.id, data: { validationError: this._provider.validationError } })
            return res.sendStatus(503)
        }
        try {
            const botId = getBotId(req)
            if (!this._provider.isValidBotId(botId)) {
                return this._error(res, ERROR_MESSAGES.INVALID_BOT_ID, req.id)
            }
        }
        catch (error) {
            logger.error({ msg: 'TelegramOauth auth-callback error', err: error, reqId: req.id })
            return next(error)
        }
    }

    _getTgAuthData (req, res) {
        const config = this._provider.getConfig(getBotId(req))
        let initialTgAuthData = req.body
        if (!Object.keys(initialTgAuthData).length) {
            const { tgAuthData: tgAuthDataQP } = req.query
            try {
                initialTgAuthData = Object.fromEntries(new URLSearchParams(tgAuthDataQP).entries())
                console.error(initialTgAuthData)
            } catch {
                return this._error(res, ERROR_MESSAGES.BODY_MISSING, req.id)
            }
        }
        const validationError = validateTgAuthData(initialTgAuthData, config.botToken)
        if (validationError) {
            return this._error(res, validationError, req.id)
        }
        let parsedTgAuthData = { ...initialTgAuthData }
        if (isValidMiniAppInitParams(initialTgAuthData)) {
            // Note: we need only "id" from tgAuthData, but better keep info for meta
            parsedTgAuthData = { ...JSON.parse(initialTgAuthData.user), ...initialTgAuthData }
        }
        parsedTgAuthData.id = String(parsedTgAuthData.id)
        return { tgAuthData: parsedTgAuthData, initialTgAuthData }
    }

    _constructQueryTgDataString (tgAuthData) {
        const sp = new URLSearchParams()
        sp.append('tgAuthData', tgAuthData)
        return sp.get('tgAuthData')
    }

    _buildUrlWithParams (baseUrl, params) {
        const url = new URL(baseUrl)
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value) 
        })
        return url
    }
}

module.exports = {
    TelegramOauthRoutes,
}