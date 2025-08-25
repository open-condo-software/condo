const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { syncUser } = require('@condo/domains/user/integration/telegram/sync/syncUser')
const {
    getRedirectUrl,
    getUserType,
} = require('@condo/domains/user/integration/telegram/utils/params')
const { getTgAuthDataValidationError, isRedirectUrlValid } = require('@condo/domains/user/integration/telegram/utils/validations')
const {
    User,
} = require('@condo/domains/user/utils/serverSchema')

const { getIdentity } = require('./sync/syncUser')
const { ERRORS, HttpError } = require('./utils/errors')
const { parseBotId, getBotId } = require('./utils/params')
const { getOauthConfigValidationError, isValidTelegramMiniAppInitParams } = require('./utils/validations')

const logger = getLogger()

function isAuthorized (req) {
    return !!req.user
}

function isUserWithRightType (req, userType) {
    return isAuthorized(req) && req.user.type === userType
}

function isSuperUser (req) {
    return isAuthorized(req) && (req.user.isAdmin || req.user.isSupport || req.user.rightsSet)
}

class BotsConfigProvider {
    isValid
    validationError
    configs = {}
    constructor () {
        try {
            this.isValid = true
            let telegramOauthConfig
            telegramOauthConfig = JSON.parse(conf.TELEGRAM_OAUTH_CONFIG || '[]')
                .map(conf => ({ ...conf, botId: parseBotId(conf.botToken) }))
            const validationError = getOauthConfigValidationError(telegramOauthConfig)
            if (validationError) {
                const err = new HttpError(validationError)
                logger.error({ msg: 'telegram oauth config error', err })
                this.isValid = false
                this.validationError = err
            }
            for (const config of telegramOauthConfig) {
                this.configs[config.botId] = config
            }
        } catch (err) {
            logger.error({ msg: 'telegram oauth config error', err } )
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
            const callbackUrl = this._buildUrlWithParams(`${conf.SERVER_URL}/api/tg/auth/callback`, {
                ...req.query,
                redirectUrl: encodeURIComponent(redirectUrl),
                tgAuthData: req.query.tgAuthData,
                botId: getBotId(req),
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
            } = this._validateParameters(req, res, next)
            // sync user
            const { keystone: context } = await getSchemaCtx('User')
            const { id } = await syncUser({ authenticatedUser: req.user, userInfo: tgAuthData, context, userType })
            // authorize user
            await this.authorizeUser(req, context, id)
            return res.redirect(decodeURIComponent(redirectUrl))
        } catch (error) {
            return this._processError(res, error, next)
        }
    }

    async authorizeUser (req, context, userId) {
        // auth session
        const botId = getBotId(req)
        const user = await User.getOne(context, { id: userId }, 'id type isSupport isAdmin rightsSet')
        if (isSuperUser({ user })) {
            throw new HttpError(ERRORS.SUPER_USERS_NOT_ALLOWED)
        }
        const { keystone } = await getSchemaCtx('User')
        await keystone._sessionManager.startAuthedSession(req, {
            item: { id: user.id },
            list: keystone.lists['User'],
            meta: {
                source: 'auth-integration',
                provider: 'telegram',
                clientID: botId,
            },
        })
        await req.session.save()
    }

    async _logoutAndRedirectToAuth (req, res, context, userType) {
        if (isAuthorized(req)) {
            await context._sessionManager.endAuthedSession(req)
        }
        const reqUrl = new URL(req.url, 'https://_')
        const returnToUrl = `${conf.SERVER_URL}${reqUrl.pathname}?${encodeURIComponent(reqUrl.searchParams.toString())}`
        return res.redirect(`/auth?next=${encodeURIComponent(returnToUrl)}&userType=${userType}`)
    }

    _validateParameters (req, res, next) {
        this._validateBotId(req)
        const botId = getBotId(req)
        const config = this._provider.getConfig(botId)
        const redirectUrl = getRedirectUrl(req)
        const userType = getUserType(req)
        if (!isRedirectUrlValid(config.allowedRedirectUrls, redirectUrl)) {
            throw new HttpError(ERRORS.INVALID_REDIRECT_URL)
        }
        if (!userType || !config.allowedUserType || config.allowedUserType.toLowerCase() !== userType.toLowerCase()) {
            throw new HttpError(ERRORS.NOT_SUPPORTED_USER_TYPE)
        }
        const { tgAuthData } = this._getTgAuthData(req)
        return {
            botId, config, redirectUrl, userType: userType.toLowerCase(), tgAuthData,
        }
    }

    _processError (res, error, next) {
        const errMsg = 'telegramOauth error'
        if (error instanceof HttpError && error.statusCode < 500) {
            logger.error({ msg: errMsg, reqId: res.req.id, data: { error: error.toJSON(), stack: error.stack } })
            return res.status(error.statusCode).json({ error: error.toJSON() })
        }
        logger.error({ msg: errMsg, reqId: res.req.id, err: error })
        return next(error)
    }
    
    _validateBotId (req) {
        if (!this._provider.isValid) {
            throw this._provider.validationError ? this._provider.validationError : new HttpError(ERRORS.INVALID_CONFIG)
        }
        const botId = getBotId(req)
        if (!this._provider.isValidBotId(botId)) {
            throw new HttpError(ERRORS.INVALID_BOT_ID)
        }
    }

    _getTgAuthData (req) {
        const config = this._provider.getConfig(getBotId(req))
        const { tgAuthData: tgAuthDataQP } = req.query
        let tgAuthData
        try {
            tgAuthData = Object.fromEntries(new URLSearchParams(decodeURIComponent(tgAuthDataQP)).entries())
        } catch {
            throw new HttpError(ERRORS.TG_AUTH_DATA_MISSING)
        }
        const tgAuthDataValidationError = getTgAuthDataValidationError(tgAuthData, config.botToken)
        if (tgAuthDataValidationError) {
            throw new HttpError(tgAuthDataValidationError)
        }
        // Note: there is 2 types of tg auth data: oauth ({ id: userId }) and tma ({ id: undefined, user: '{"id": userId}' }).
        if (isValidTelegramMiniAppInitParams(tgAuthData)) {
            // Note: we need only "id" from tgAuthData, but better keep info for meta
            tgAuthData = { ...tgAuthData, ...JSON.parse(tgAuthData.user) }
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