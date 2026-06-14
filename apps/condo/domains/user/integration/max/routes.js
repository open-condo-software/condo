const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { syncUser } = require('@condo/domains/user/integration/max/sync/syncUser')
const {
    getRedirectUrl,
    getUserType,
} = require('@condo/domains/user/integration/max/utils/params')
const { getMaxAuthDataValidationError, isRedirectUrlValid } = require('@condo/domains/user/integration/max/utils/validations')
const {
    User,
} = require('@condo/domains/user/utils/serverSchema')

const { getIdentity } = require('./sync/syncUser')
const { ERRORS, HttpError } = require('./utils/errors')
const { getBotId } = require('./utils/params')
const { getOauthConfigValidationError } = require('./utils/validations')

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
            let maxOauthConfig
            maxOauthConfig = JSON.parse(conf.MAX_OAUTH_CONFIG || '[]')
            const validationError = getOauthConfigValidationError(maxOauthConfig)
            if (validationError) {
                const err = new HttpError(validationError)
                logger.error({ msg: 'max oauth config error', err })
                this.isValid = false
                this.validationError = err
            }
            for (const config of maxOauthConfig) {
                this.configs[config.botId] = config
            }
        } catch (err) {
            logger.error({ msg: 'max oauth config error', err } )
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

class MaxOauthRoutes {
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
                maxAuthData,
            } = this._validateParameters(req, res, next)
            const { keystone: context } = await getSchemaCtx('User')
            const identity = await getIdentity(context, maxAuthData, userType)
            const callbackUrl = this._buildUrlWithParams(`${conf.SERVER_URL}/api/max/auth/callback`, {
                ...req.query,
                redirectUrl: encodeURIComponent(redirectUrl),
                maxAuthData: req.query.maxAuthData,
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
                maxAuthData,
            } = this._validateParameters(req, res, next)
            // sync user
            const { keystone: context } = await getSchemaCtx('User')
            const { id } = await syncUser({ authenticatedUser: req.user, userInfo: maxAuthData, context, userType })
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
                provider: 'max',
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
        // NOTE: Mirror the Telegram flow: redirect to a relative "/auth" so the resident-app
        // Max proxy (/api/auth/max/proxy/*) can rewrite the "next" query param to its own path and
        // inject "authFlow=needAuth". Keeping the browser on the resident-app domain is required so
        // condo sees the session cookie created during phone auth (it is host-only, scoped to the
        // resident-app host by the GraphQL proxy). A direct redirect to condo's domain would loop.
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
        const { maxAuthData } = this._getMaxAuthData(req)
        return {
            botId, config, redirectUrl, userType: userType.toLowerCase(), maxAuthData,
        }
    }

    _processError (res, error, next) {
        const errMsg = 'maxOauth error'
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

    _getMaxAuthData (req) {
        const config = this._provider.getConfig(getBotId(req))
        const { maxAuthData: maxAuthDataQP } = req.query
        let maxAuthData
        try {
            maxAuthData = Object.fromEntries(new URLSearchParams(decodeURIComponent(maxAuthDataQP)).entries())
        } catch {
            throw new HttpError(ERRORS.MAX_AUTH_DATA_MISSING)
        }
        const maxAuthDataValidationError = getMaxAuthDataValidationError(maxAuthData, config.botToken)
        if (maxAuthDataValidationError) {
            throw new HttpError(maxAuthDataValidationError)
        }
        // Note: Max init data contains user as JSON string
        if (maxAuthData.user && typeof maxAuthData.user === 'string') {
            maxAuthData = { ...maxAuthData, ...JSON.parse(maxAuthData.user) }
        }
        maxAuthData.id = String(maxAuthData.id)
        return { maxAuthData }
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
    MaxOauthRoutes,
}
