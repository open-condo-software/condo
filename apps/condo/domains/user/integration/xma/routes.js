const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { syncUser } = require('@condo/domains/user/integration/xma/sync/syncUser')
const {
    getRedirectUrl,
    getUserType,
} = require('@condo/domains/user/integration/xma/utils/params')
const { getXmaAuthDataValidationError, isRedirectUrlValid } = require('@condo/domains/user/integration/xma/utils/validations')
const {
    User,
} = require('@condo/domains/user/utils/serverSchema')

const { getIdentity } = require('./sync/syncUser')
const { ERRORS, HttpError } = require('./utils/errors')
const { getBotId } = require('./utils/params')
const { getConfigValidationError } = require('./utils/validations')

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
            let xmaConfig
            xmaConfig = JSON.parse(conf.XMA_CONFIG || '[]')
            const validationError = getConfigValidationError(xmaConfig)
            if (validationError) {
                const err = new HttpError(validationError)
                logger.error({ msg: 'xma config error', err })
                this.isValid = false
                this.validationError = err
            }
            for (const config of xmaConfig) {
                this.configs[config.botId] = config
            }
        } catch (err) {
            logger.error({ msg: 'xma oauth config error', err } )
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

class XmaRoutes {
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
                xmaAuthData,
            } = this._validateParameters(req, res, next)
            const { keystone: context } = await getSchemaCtx('User')
            const identity = await getIdentity(context, xmaAuthData, userType)
            const callbackUrl = this._buildUrlWithParams(`${conf.SERVER_URL}/api/xma/auth/callback`, {
                ...req.query,
                redirectUrl: encodeURIComponent(redirectUrl),
                xmaAuthData: req.query.xmaAuthData,
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
                xmaAuthData,
            } = this._validateParameters(req, res, next)
            // sync user
            const { keystone: context } = await getSchemaCtx('User')
            const { id } = await syncUser({ authenticatedUser: req.user, userInfo: xmaAuthData, context, userType })
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
                provider: 'xma',
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
        // XMA proxy (/api/auth/xma/proxy/*) can rewrite the "next" query param to its own path and
        // inject "authFlow=needAuth". Keeping the browser on the resident-app domain is required so
        // condo sees the session cookie created during phone auth (it is host-only, scoped to the
        // resident-app host by the GraphQL proxy). A direct redirect to resident-app's domain would loop.
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
        const { xmaAuthData } = this._getXmaAuthData(req)
        return {
            botId, config, redirectUrl, userType: userType.toLowerCase(), xmaAuthData,
        }
    }

    _processError (res, error, next) {
        const errMsg = 'xmaOauth error'
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

    _getXmaAuthData (req) {
        const config = this._provider.getConfig(getBotId(req))
        const { xmaAuthData: xmaAuthDataQP } = req.query
        let xmaAuthData
        try {
            xmaAuthData = Object.fromEntries(new URLSearchParams(decodeURIComponent(xmaAuthDataQP)).entries())
        } catch {
            throw new HttpError(ERRORS.XMA_AUTH_DATA_MISSING)
        }
        const xmaAuthDataValidationError = getXmaAuthDataValidationError(xmaAuthData, config.botToken)
        if (xmaAuthDataValidationError) {
            throw new HttpError(xmaAuthDataValidationError)
        }
        // Note: XMA init data contains user as JSON string
        if (xmaAuthData.user && typeof xmaAuthData.user === 'string') {
            xmaAuthData = { ...xmaAuthData, ...JSON.parse(xmaAuthData.user) }
        }
        xmaAuthData.id = String(xmaAuthData.id)
        return { xmaAuthData }
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
    XmaRoutes,
}
