const express = require('express')
const jwt = require('jsonwebtoken')
const nextCookie = require('next-cookies')

const conf = require('@open-condo/config')
const { GQLError } = require('@open-condo/keystone/errors')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')
const { expressErrorHandler } = require('@open-condo/keystone/utils/errors/expressErrorHandler')

const { CHANNEL_DEFINITIONS } = require('../core/topic')
const { ERRORS } = require('../errors')

const logger = getLogger()

const TOKEN_SECRET = conf.MESSAGING_TOKEN_SECRET
const TOKEN_TTL = conf.MESSAGING_TOKEN_TTL || '24h'
const RATE_LIMIT_MAX_REQUESTS = parseInt(conf.MESSAGING_RATE_LIMIT_MAX) || 20
const RATE_LIMIT_WINDOW_SEC = parseInt(conf.MESSAGING_RATE_LIMIT_WINDOW_SEC) || 60

const GET_EMPLOYEE_QUERY = `
    query getEmployee($id: ID!) {
        employee: OrganizationEmployee(where: { id: $id }) {
            id
            organization { id }
            user { id }
        }
    }
`

function authHandler () {
    return function (req, res, next) {
        if (!req.user || !req.user.id) {
            return next(new GQLError(ERRORS.AUTHORIZATION_REQUIRED, { req }))
        }
        next()
    }
}

function rateLimitHandler () {
    const kvClient = getKVClient('guards')
    return async function (req, res, next) {
        const ip = req.ip || req.socket?.remoteAddress || 'unknown'
        const key = `messaging_rate:${ip}`
        try {
            const count = await kvClient.incr(key)
            if (count === 1) {
                await kvClient.expire(key, RATE_LIMIT_WINDOW_SEC)
            }
            if (count > RATE_LIMIT_MAX_REQUESTS) {
                logger.warn({ msg: 'Rate limit exceeded', ip, path: req.path })
                return next(new GQLError(ERRORS.RATE_LIMIT_EXCEEDED, { req }))
            }
        } catch (err) {
            logger.error({ msg: 'Rate limit check failed, allowing request', err })
        }
        next()
    }
}

function resolveEmployeeContextHandler ({ keystone }) {
    return async function (req, res, next) {
        const cookies = nextCookie({ req })
        const employeeId = cookies.organizationLinkId

        if (!employeeId) {
            return next(new GQLError(ERRORS.NO_ORGANIZATION_SELECTED, { req }))
        }

        const context = await keystone.createContext({ skipAccessControl: true })
        const employee = await context.executeGraphQL({
            query: GET_EMPLOYEE_QUERY,
            variables: { id: employeeId },
        })

        const employeeData = employee?.data?.employee
        if (!employeeData || employeeData.user?.id !== req.user.id) {
            return next(new GQLError(ERRORS.INVALID_ORGANIZATION_SELECTION, { req }))
        }

        const organizationId = employeeData.organization?.id
        if (!organizationId) {
            return next(new GQLError(ERRORS.ORGANIZATION_NOT_FOUND, { req }))
        }

        req.messaging = { userId: req.user.id, organizationId }
        next()
    }
}

function buildChannels (userId, organizationId) {
    const context = { userId, organizationId }
    return CHANNEL_DEFINITIONS.map(ch => ch.buildAvailableChannel(context))
}

class MessagingMiddleware {
    prepareMiddleware ({ keystone }) {
        // internal Keystone middleware for messaging token/auth endpoints, not a standalone user-facing Express app
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.use(express.json())

        app.get(
            '/messaging/channels',
            authHandler(),
            rateLimitHandler(),
            resolveEmployeeContextHandler({ keystone }),
            (req, res) => {
                const { userId, organizationId } = req.messaging
                const channels = buildChannels(userId, organizationId)
                return res.json({ channels, userId, organizationId })
            }
        )

        app.get(
            '/messaging/token',
            authHandler(),
            rateLimitHandler(),
            resolveEmployeeContextHandler({ keystone }),
            (req, res, next) => {
                if (!TOKEN_SECRET) {
                    return next(new GQLError(ERRORS.MESSAGING_NOT_CONFIGURED, { req }))
                }

                const { userId, organizationId } = req.messaging
                const token = jwt.sign(
                    { userId, organizationId },
                    TOKEN_SECRET,
                    { expiresIn: TOKEN_TTL }
                )

                return res.json({ token, userId, organizationId })
            }
        )

        app.use(expressErrorHandler)

        return app
    }
}

module.exports = { MessagingMiddleware }
