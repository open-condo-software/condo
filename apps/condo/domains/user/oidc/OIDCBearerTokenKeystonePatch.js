const { get } = require('lodash')

const { getSchemaCtx } = require('@core/keystone/schema')
const { safeFormatError } = require('@condo/domains/common/utils/apolloErrorFormatter')

const { AdapterFactory } = require('./adapter')
const { logger } = require('./logger')

function getOidcToken (req) {
    try {
        let authHeader = req.headers.authorization || req.headers.Authorization
        if (!authHeader) {
            return
        }

        if (Array.isArray(authHeader)) {
            authHeader = authHeader[0]
        }

        const [type, token] = authHeader.split(' ')

        if (!type || !token) return
        if (type !== 'Bearer' || token.length !== 43 || token.includes('.')) return

        return token
    } catch (e) {
        logger.error({
            message: 'ERROR<-getOidcToken()',
            error: safeFormatError(e),
        })
    }
}

function OIDCBearerTokenKeystonePatch (app) {
    const tokens = new AdapterFactory('AccessToken')
    // const grants = new AdapterFactory('Grant')

    app.use(async function oidcBearerTokenPatchMiddleware (req, res, next) {
        // We want to detect request with OIDC AccessToken and without req.user!
        // In such case we need to update req.session and req.user to user from AccessToken!
        const oidcToken = getOidcToken(req)
        if (oidcToken && !req.path.startsWith('/oidc')) {
            const token = await tokens.find(oidcToken)
            const account = get(token, 'accountId')

            if (token && account) {
                // NOTE: we found OIDC Token but this req.user and req.session is not for that user! We need to fix it

                try {
                    // NOTE: We want to save current session! We need to rollback it at the end!
                    const reqSession = req.session
                    const reqSessionID = req.sessionID

                    // NOTE: create new req.session with authenticated token!
                    // NOTE: probably, we also destroy the current req.session... but it's ok
                    const { keystone } = await getSchemaCtx('User')
                    await keystone._sessionManager.startAuthedSession(req, { item: { id: account }, list: keystone.lists['User'] })

                    // It's a copy/past from `@keystonejs/session/src/session.ts:getSessionMiddleware`
                    // Wee need to update req.user and req.authedListKey because the keystone need to use it for authentication.
                    const item = await keystone._sessionManager._getAuthedItem(req, keystone)
                    if (item) {
                        req.user = item
                        req.authedListKey = req.session.keystoneListKey
                    }

                    // NOTE: So we need to rollback this req.session changes at the end!
                    // Because we really don't want to change this session!
                    // WARNING: this code is for prevent the security risk! Because, the updated req.session is authenticated by user from access_token
                    const _end = res.end
                    let ended = false
                    res.end = function end (chunk, encoding) {
                        if (ended) return false
                        ended = true
                        req.session = reqSession
                        req.sessionID = reqSessionID
                        return _end.call(res, chunk, encoding)
                    }
                } catch (error) {
                    logger.error({
                        message: 'ERROR<-oidcBearerTokenPatchMiddleware()',
                        error: safeFormatError(error),
                    })
                    throw error
                }
            }
        }

        next()
    })
}

module.exports = {
    OIDCBearerTokenKeystonePatch,
}
