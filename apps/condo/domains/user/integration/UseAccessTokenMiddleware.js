const express = require('express')

const { getLogger } = require('@open-condo/keystone/logging')
const { expressErrorHandler } = require('@open-condo/keystone/logging/expressErrorHandler')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const ACCEPT_HEADER_FOR_GRAPHQL_PLAYGROUND = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'


// Will live in database and postgres
const tokens = [
    { id: '1', userId: 'da636067-284b-43f5-8032-309229069ce0', organizationIds: ['3eb33681-8080-4fcd-a971-4f58023db71e', '190b4a79-267a-4c5b-a6b0-be238ad97833'] },
    { id: '2', userId: '462f2582-2bc5-4b2b-a60e-ba2143fb85b5', organizationIds: ['3eb33681-8080-4fcd-a971-4f58023db71e', '9b76bd01-6e5b-4cc9-baf3-263048d090f1'] },
    { id: '3', userId: '3f3cd4d0-f3e8-4a5f-9108-385847efbadd', organizationIds: ['3eb33681-8080-4fcd-a971-4f58023db71e', 'bade6cd7-1fba-453c-915f-0242ba098808'] },
]

const logger = getLogger('UseAccessTokenMiddleware')

function parseAccessToken (req) {
    try {
        // Maybe look for another header, like access-token?
        let authHeader = req.headers.authorization || req.headers.Authorization
        if (!authHeader) {
            return
        }

        if (Array.isArray(authHeader)) {
            authHeader = authHeader[0]
        }

        const [type, token] = authHeader.split(' ')

        if (!type || !token) return
        if (type !== 'Bearer') return

        return token
    } catch (error) {
        logger.error({ msg: 'parseAccessToken error', error })
    }
}

class UseAccessTokenMiddleware {
    _requestAcceptHeaderValuesForPlaygroundPage = new Set(ACCEPT_HEADER_FOR_GRAPHQL_PLAYGROUND.split(','))

    getDataByToken (token) {
        // will actually search in redis
        return tokens.find(({ id }) => id === token)
    }

    patchUser (item, data) {
        item.extra = {
            allowedOrganizations: data.allowedOrganizations,
        }
    }
    
    startAuthedSessionForServiceUser (keystone, req, data) {
        return keystone._sessionManager.startAuthedSession(req, { item: { id: data.userId }, list: keystone.lists['User'] })
    }

    isAccessingPlaygroundPage (req) {
        const acceptHeader = req.get('Accept')
        return acceptHeader && acceptHeader
            .split(',')
            .every(acceptHeaderValue => this._requestAcceptHeaderValuesForPlaygroundPage.has(acceptHeaderValue))
    }

    prepareMiddleware ({ keystone }) {
        const app = express()

        app.use(async function middle (req, res, next) {
            if (!req.path.startsWith('/admin/api')) {
                next()
                return
            }

            if (this.isAccessingPlaygroundPage(req)) {
                next()
                return
            }

            const token = parseAccessToken(req)
            if (!token) {
                next()
                return
            }

            const data = this.getDataByToken(token)
            if (!data) {
                logger.error({ msg: 'No stored token', error: new Error(`No stored token for ${token}`) })
                next()
                return
            }

            const reqSession = req.session
            const reqSessionID = req.sessionID
            
            const { keystone } = await getSchemaCtx('User')
            
            await this.startAuthedSessionForServiceUser(keystone, req, data)

            // It's a copy/past from `@keystonejs/session/src/session.ts:getSessionMiddleware`
            // Wee need to update req.user and req.authedListKey because the keystone need to use it for authentication.
            const item = await keystone._sessionManager._getAuthedItem(req, keystone)
            if (item) {
                req.user = item
                req.authedListKey = req.session.keystoneListKey
                this.patchUser(req.user, data)
            }

            const _end = res.end
            let ended = false
            res.end = function end (chunk, encoding) {
                if (ended) return false
                ended = true
                req.session = reqSession
                req.sessionID = reqSessionID
                return _end.call(res, chunk, encoding)
            }

            next()
        }.bind(this))

        app.use(expressErrorHandler)

        return app
    }
}

module.exports = {
    UseAccessTokenMiddleware,
}