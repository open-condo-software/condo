const express = require('express')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getAuthCookieOptions } = require('@open-condo/keystone/setup.utils')

class SessionTrackMiddleware {
    static TARGET_COOKIE_OPTIONS = ['sameSite', 'https', 'secure']

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


    static async adjustCookieOptionsMiddleware (req, res, next) {
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

        // NOTE: is cookie policies change -> regenerate session,
        // after regeneration fill missing (KS-related or custom) properties from old one
        // It's the only safe variant to ensure we actually change cookie
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

    async prepareMiddleware () {
        // this route can not be used for csrf attack (because no cookies and tokens are used in a public route)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        app.use(SessionTrackMiddleware.adjustCookieOptionsMiddleware)

        return app
    }
}

module.exports = {
    SessionTrackMiddleware,
}