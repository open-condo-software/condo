const express = require('express')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getAuthCookieOptions } = require('@open-condo/keystone/setup.utils')

class SessionTrackMiddleware {
    static TARGET_COOKIE_OPTIONS = ['sameSite', 'httpOnly', 'secure']
    static ACTIVITY_TRACK_WINDOW_MS = 60 * 1_000 // 1 minute

    /**
     * Checks if session was acquired via auth token, you cannot check cookies,
     * because keystone under the hood replaces cookie value with header
     * (https://github.com/open-condo-software/open-keystone/blob/main/packages/session/src/session.ts#L88)
     * @param req {import('express').Request}
     */
    static isTokenBasedAuth (req) {
        const authToken = req.headers.authorization
        if (typeof authToken !== 'string') return false
        const [tokenType] = authToken.split(' ')

        return tokenType === 'Bearer'
    }

    static isKSAuthedSession (session) {
        return session && session.keystoneListKey && session.keystoneItemId
    }


    static adjustCookieOptionsMiddleware (req, res, next) {
        if (SessionTrackMiddleware.isTokenBasedAuth(req)) {
            return next()
        }

        const existingCookieOptions = get(req, ['session', 'cookie'])
        if (!existingCookieOptions || typeof existingCookieOptions !== 'object') return next()
        // NOTE: Does not include maxAge here, since calling touch changes it, so isEqualOptions will always be false
        const targetCookieOptions = getAuthCookieOptions(conf)
        const isEqualOptions = SessionTrackMiddleware.TARGET_COOKIE_OPTIONS
            .filter(option => targetCookieOptions.hasOwnProperty(option))
            .every(option => targetCookieOptions[option] === existingCookieOptions[option])

        if (isEqualOptions) return next()

        const existingSessionData = { ...req.session }

        // NOTE 1: is cookie policies change -> regenerate session,
        // after regeneration fill missing (KS-related or custom) properties from old one
        // It's the only safe variant to ensure we actually change cookie
        // NOTE 2: calling session.save after is not required.
        // Because we modify session, and express-session will update / set new cookie later in request chain (on req.sendHeaders)
        req.session.regenerate((err) => {
            if (err) return next(err)

            for (const [key, value] of Object.entries(existingSessionData)) {
                if (!req.session.hasOwnProperty(key)) {
                    req.session[key] = value
                }
            }

            return next()
        })
    }

    static trackLastActivityMiddleware (req, res, next) {
        const session = get(req, 'session')

        // NOTE: We don't want to track unauthed (or OIDC) requests, at least for now.
        // It also includes auth mutations (since, request counts as unauthed)
        // Because if we modify req.session.anything then express-session will store it session-store (KV),
        // That means new session (KV entrance) for each anonymous request
        // So, for now we'll only track KS-authed requests.
        // TODO(SavelevMatthew): think about tracking oidc requests as well from non-emptiness,
        //  but its catchy (session might be modified after middleware).
        //  Maybe intercept sessionStore.set method, or regenerate / save session methods
        if (!SessionTrackMiddleware.isKSAuthedSession(session)) return next()

        const lastActivityMs = session.lastActivityTimestamp ?? 0
        const now = Date.now()

        // NOTE: we don't want to spam KV-store on each request, so we have small rate-limit to update here
        if (lastActivityMs + SessionTrackMiddleware.ACTIVITY_TRACK_WINDOW_MS < now) {
            req.session.lastActivityTimestamp = now
        }

        return next()
    }

    async prepareMiddleware () {
        // this route can not be used for csrf attack (because no cookies and tokens are used in a public route)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        app.use(
            SessionTrackMiddleware.adjustCookieOptionsMiddleware,
            SessionTrackMiddleware.trackLastActivityMiddleware,
        )

        return app
    }
}

module.exports = {
    SessionTrackMiddleware,
}