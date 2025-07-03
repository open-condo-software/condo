const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { syncUser } = require('@condo/domains/user/integration/telegram/sync/syncUser')
const {
    getRedirectUrl,
    getUserType,
} = require('@condo/domains/user/integration/telegram/utils/params')
const { validateTgAuthData, validateRedirectUrl } = require('@condo/domains/user/integration/telegram/utils/validations')
const {
    User,
} = require('@condo/domains/user/utils/serverSchema')

const { getIdentity } = require('./sync/syncUser')
const { ERRORS, TelegramOauthError } = require('./utils/errors')
const { parseBotId, getBotId } = require('./utils/params')
const { validateOauthConfig, isValidMiniAppInitParams } = require('./utils/validations')

const logger = getLogger('telegram-oauth/routes')

function isAuthorized (req) {
    return !!req.user
}

function isUserWithRightType (req, userType) {
    return isAuthorized(req) && req.user.type === userType
}

function isSuperUser (req) {
    return isAuthorized(req) && (req.user.isAdmin || req.user.isSupport)
}

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
        try {
            const {
                redirectUrl,
                userType,
                tgAuthData,
            } = this._validateParameters(req, res, next)
            const { keystone: context } = await getSchemaCtx('User')
            const identity = await getIdentity(context, tgAuthData, userType)
            const callbackUrl = this._buildUrlWithParams(`${conf.SERVER_URL}/api/tg/${getBotId(req)}/auth/callback`, {
                ...req.query,
                redirectUrl: encodeURIComponent(redirectUrl),
                tgAuthData: req.query.tgAuthData,
            })
            if (identity) {
                if (isAuthorized(req) && (!isUserWithRightType(req, userType) || isSuperUser(req) || identity.user.id !== req.user.id)) {
                    return await this._logoutAndRedirectToAuth(req, res, context, userType)
                }
                return res.redirect(callbackUrl)
            }
            if (!isAuthorized(req) || !isUserWithRightType(req, userType) || isSuperUser(req)) {
                return await this._logoutAndRedirectToAuth(req, res, context, userType)
            }
            return res.redirect(callbackUrl)
        } catch (err) {
            return this._processError(res, err, next)
        }
    }

    async completeAuth (req, res, next) {
        try {
            const {
                redirectUrl,
                userType,
                tgAuthData,
                config,
            } = this._validateParameters(req, res, next)
            // sync user
            const { keystone: context } = await getSchemaCtx('User')
            const { id } = await syncUser({ authenticatedUser: req.user, userInfo: tgAuthData, context, userType })
            // authorize user
            await this.authorizeUser(req, context, id)
            const params = {
                ...req.query,
                client_id: config.oidcClientId,
                response_type: 'code',
                redirect_uri: decodeURIComponent(redirectUrl),
                scope: 'openid',
            }
            delete params.redirectUrl
            const oidcUrl = this._buildUrlWithParams(`${conf.SERVER_URL}/oidc/auth`, params)
            return res.redirect(oidcUrl)
        } catch (error) {
            return this._processError(res, error, next)
        }
    }

    async authorizeUser (req, context, userId) {
        // auth session
        const user = await User.getOne(context, { id: userId }, 'id type isSupport isAdmin')
        if (user.isSupport || user.isAdmin) {
            throw new TelegramOauthError(ERRORS.SUPER_USERS_NOT_ALLOWED)
        }
        const { keystone } = await getSchemaCtx('User')
        await keystone._sessionManager.startAuthedSession(req, { item: { id: user.id }, list: keystone.lists['User'] })
        await req.session.save()
    }

    async _logoutAndRedirectToAuth (req, res, context, userType) {
        if (isAuthorized(req)) {
            await context._sessionManager.endAuthedSession(req)
        }
        const reqUrl = new URL(`https://www.dummy-url.com${req.url}`)
        const returnToUrl = `${conf.SERVER_URL}${reqUrl.pathname}?${encodeURIComponent(reqUrl.searchParams.toString())}`
        return res.redirect(`/auth?next=${encodeURIComponent(returnToUrl)}&userType=${userType}`)
    }

    _validateParameters (req, res, next) {
        this._validateBotId(req)
        if (!req.query.state) {
            throw new TelegramOauthError(ERRORS.INVALID_STATE)
        }
        if (!req.query.nonce) {
            throw new TelegramOauthError(ERRORS.INVALID_NONCE)
        }
        const botId = getBotId(req)
        const config = this._provider.getConfig(botId)
        const redirectUrl = getRedirectUrl(req)
        const userType = getUserType(req)
        if (!validateRedirectUrl(config.allowedRedirectUrls, redirectUrl)) {
            throw new TelegramOauthError(ERRORS.INVALID_REDIRECT_URL)
        }
        if (!userType || !config.allowedUserType || config.allowedUserType.toLowerCase() !== userType.toLowerCase()) {
            throw new TelegramOauthError(ERRORS.NOT_SUPPORTED_USER_TYPE)
        }
        const { tgAuthData } = this._getTgAuthData(req)
        return {
            botId, config, redirectUrl, userType: userType.toLowerCase(), tgAuthData,
        }
    }

    _processError (res, error, next) {
        const errMsg = 'TelegramOauth error'
        if (error instanceof TelegramOauthError && error.status < 500) {
            logger.error({ msg: errMsg, reqId: res.req.id, data: { error: error.toJSON(), stack: error.stack } })
            return res.status(error.status).json({ error: error.toJSON() })
        }
        logger.error({ msg: errMsg, reqId: res.req.id, err: error })
        return next(error)
    }
    
    _validateBotId (req) {
        if (!this._provider.isValid) {
            throw new TelegramOauthError(ERRORS.INVALID_CONFIG)
        }
        const botId = getBotId(req)
        if (!this._provider.isValidBotId(botId)) {
            throw new TelegramOauthError(ERRORS.INVALID_BOT_ID, req.id)
        }
    }

    _getTgAuthData (req) {
        const config = this._provider.getConfig(getBotId(req))
        const { tgAuthData: tgAuthDataQP } = req.query
        let tgAuthData
        try {
            tgAuthData = Object.fromEntries(new URLSearchParams(tgAuthDataQP).entries())
        } catch {
            throw new TelegramOauthError(ERRORS.TG_AUTH_DATA_MISSING)
        }
        validateTgAuthData(tgAuthData, config.botToken)
        if (isValidMiniAppInitParams(tgAuthData)) {
            // Note: we need only "id" from tgAuthData, but better keep info for meta
            tgAuthData = { ...JSON.parse(tgAuthData.user), ...tgAuthData }
        }
        tgAuthData.id = String(tgAuthData.id)
        return { tgAuthData }
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