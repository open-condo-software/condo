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

const MESSAGING_CONFIG = conf.MESSAGING_CONFIG ? JSON.parse(conf.MESSAGING_CONFIG) : {}

const TOKEN_SECRET = MESSAGING_CONFIG.tokenSecret
const TOKEN_TTL = MESSAGING_CONFIG.tokenTtl || '24h'
const RATE_LIMIT_MAX_REQUESTS = parseInt(MESSAGING_CONFIG.rateLimitMax) || 20
const RATE_LIMIT_WINDOW_SEC = parseInt(MESSAGING_CONFIG.rateLimitWindowSec) || 60

const GET_EMPLOYEE_QUERY = `
    query getEmployee($id: ID!) {
        employee: OrganizationEmployee(where: { id: $id }) {
            id
            isAccepted
            isRejected
            isBlocked
            deletedAt
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
        const ipKey = `messaging_rate:ip:${ip}`
        try {
            const ipCount = await kvClient.incr(ipKey)
            if (ipCount === 1) {
                await kvClient.expire(ipKey, RATE_LIMIT_WINDOW_SEC)
            }
            if (ipCount > RATE_LIMIT_MAX_REQUESTS) {
                logger.warn({ msg: 'Rate limit exceeded (IP)', ip, path: req.path })
                return next(new GQLError(ERRORS.RATE_LIMIT_EXCEEDED, { req }))
            }

            const userId = req.user?.id
            if (userId) {
                const userKey = `messaging_rate:user:${userId}`
                const userCount = await kvClient.incr(userKey)
                if (userCount === 1) {
                    await kvClient.expire(userKey, RATE_LIMIT_WINDOW_SEC)
                }
                if (userCount > RATE_LIMIT_MAX_REQUESTS) {
                    logger.warn({ msg: 'Rate limit exceeded (user)', userId, path: req.path })
                    return next(new GQLError(ERRORS.RATE_LIMIT_EXCEEDED, { req }))
                }
            }
        } catch (err) {
            logger.error({ msg: 'Rate limit check failed, allowing request', err })
        }
        next()
    }
}

function resolveEmployeeContextHandler ({ keystone }) {
    return async function (req, res, next) {
        if (req.user.type === 'resident') {
            req.messaging = { userId: req.user.id, organizationId: null }
            return next()
        }

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

        if (!employeeData.isAccepted || employeeData.isRejected || employeeData.isBlocked || employeeData.deletedAt) {
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
    return CHANNEL_DEFINITIONS
        .filter(ch => ch.isAvailable(context))
        .map(ch => ch.buildAvailableChannel(context))
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
