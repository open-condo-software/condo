const conf = require('@open-condo/config')
const { GQLError } = require('@open-condo/keystone/errors')
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
const { ERRORS } = require('./utils/errors')
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
    constructor (context) {
        try {
            this.isValid = true
            let xmaConfig
            xmaConfig = JSON.parse(conf.XMA_CONFIG || '[]')
            const validationError = getConfigValidationError(xmaConfig)
            if (validationError) {
                const err = new GQLError(validationError, context)
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
        const { keystone: context } = getSchemaCtx('User')
        this.context = context
        this._provider = new BotsConfigProvider(context)
    }

    async startAuth (req, res, next) {
        try {
            const {
                redirectUrl,
                userType,
                xmaAuthData,
            } = this._validateParameters(req, res, next)
            
            const identity = await getIdentity(this.context, xmaAuthData, userType)
            const callbackUrl = this._buildUrlWithParams(`${conf.SERVER_URL}/api/xma/auth/callback`, {
                ...req.query,
                redirectUrl: encodeURIComponent(redirectUrl),
                xmaAuthData: req.query.xmaAuthData,
                botId: getBotId(req),
            })
            if (identity) {
                if (isAuthorized(req) && (!isUserWithRightType(req, userType) || isSuperUser(req) || identity.user.id !== req.user.id)) {
                    return await this._logoutAndRedirectToAuth(req, res, userType)
                }
                return res.redirect(callbackUrl)
            }
            if (!isAuthorized(req) || !isUserWithRightType(req, userType) || isSuperUser(req)) {
                return await this._logoutAndRedirectToAuth(req, res, userType)
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
            const { id } = await syncUser({ authenticatedUser: req.user, userInfo: xmaAuthData, context: this.context, userType })
            // authorize user
            await this.authorizeUser(req, id)
            return res.redirect(decodeURIComponent(redirectUrl))
        } catch (error) {
            return this._processError(res, error, next)
        }
    }

    async authorizeUser (req, userId) {
        // auth session
        const botId = getBotId(req)
        const user = await User.getOne(this.context, { id: userId }, 'id type isSupport isAdmin rightsSet')
        if (isSuperUser({ user })) {
            throw new GQLError(ERRORS.SUPER_USERS_NOT_ALLOWED, this.context)
        }
        const { keystone } = getSchemaCtx('User')
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

    async _logoutAndRedirectToAuth (req, res, userType) {
        if (isAuthorized(req)) {
            await this.context._sessionManager.endAuthedSession(req)
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
            throw new GQLError(ERRORS.INVALID_REDIRECT_URL, this.context)
        }
        if (!userType || !config.allowedUserType || config.allowedUserType.toLowerCase() !== userType.toLowerCase()) {
            throw new GQLError(ERRORS.NOT_SUPPORTED_USER_TYPE, this.context)
        }
        const { xmaAuthData } = this._getXmaAuthData(req)
        return {
            botId, config, redirectUrl, userType: userType.toLowerCase(), xmaAuthData,
        }
    }

    _processError (res, error, next) {
        logger.error({ msg: 'xmaAuth error', reqId: res.req.id, err: error })

        throw error
    }
    
    _validateBotId (req) {
        if (!this._provider.isValid) {
            throw this._provider.validationError ? this._provider.validationError : new GQLError(ERRORS.INVALID_CONFIG, this.context)
        }
        const botId = getBotId(req)
        if (!this._provider.isValidBotId(botId)) {
            throw new GQLError(ERRORS.INVALID_BOT_ID, this.context)
        }
    }

    _getXmaAuthData (req) {
        const config = this._provider.getConfig(getBotId(req))
        const { xmaAuthData: xmaAuthDataQP } = req.query
        let xmaAuthData
        try {
            xmaAuthData = Object.fromEntries(new URLSearchParams(decodeURIComponent(xmaAuthDataQP)).entries())
        } catch {
            throw new GQLError(ERRORS.XMA_AUTH_DATA_MISSING, this.context)
        }
        const xmaAuthDataValidationError = getXmaAuthDataValidationError(xmaAuthData, config.botToken)
        if (xmaAuthDataValidationError) {
            throw new GQLError(xmaAuthDataValidationError, this.context)
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
