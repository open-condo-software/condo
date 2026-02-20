const express = require('express')
const jwt = require('jsonwebtoken')
const nextCookie = require('next-cookies')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { getAvailableChannels } = require('../core/AccessControl')

const logger = getLogger()

const TOKEN_SECRET = conf.MESSAGING_TOKEN_SECRET

const GET_EMPLOYEE_QUERY = `
    query getEmployee($id: ID!) {
        employee: OrganizationEmployee(where: { id: $id }) {
            id
            organization { id }
            user { id }
        }
    }
`

async function resolveEmployeeContext (req, keystone) {
    const user = req.user
    const userId = user?.id

    if (!userId) {
        return { error: { status: 401, message: 'Not authenticated' } }
    }

    const cookies = nextCookie({ req })
    const employeeId = cookies.organizationLinkId

    if (!employeeId) {
        return { error: { status: 401, message: 'No organization selected' } }
    }

    const context = await keystone.createContext({ skipAccessControl: true })

    const employee = await context.executeGraphQL({
        query: GET_EMPLOYEE_QUERY,
        variables: { id: employeeId },
    })

    const employeeData = employee?.data?.employee

    if (!employeeData || employeeData.user?.id !== userId) {
        return { error: { status: 403, message: 'Invalid organization selection' } }
    }

    const organizationId = employeeData.organization?.id

    if (!organizationId) {
        return { error: { status: 500, message: 'Organization not found' } }
    }

    return { userId, organizationId, context }
}

class MessagingMiddleware {
    prepareMiddleware ({ keystone }) {
        // internal Keystone middleware for messaging token/auth endpoints, not a standalone user-facing Express app
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.use(express.json())

        app.get('/messaging/channels', async (req, res) => {
            try {
                const result = await resolveEmployeeContext(req, keystone)
                if (result.error) {
                    return res.status(result.error.status).json({ error: result.error.message })
                }

                const { userId, organizationId, context } = result
                const channels = await getAvailableChannels(context, userId, organizationId)

                return res.json({ channels, organizationId })
            } catch (error) {
                logger.error({ msg: 'Failed to get available channels', err: error })
                return res.status(500).json({ error: 'Failed to get available channels' })
            }
        })

        app.get('/messaging/token', async (req, res) => {
            try {
                if (!TOKEN_SECRET) {
                    logger.error({ msg: 'MESSAGING_TOKEN_SECRET is not configured' })
                    return res.status(503).json({ error: 'Messaging is not configured' })
                }

                const result = await resolveEmployeeContext(req, keystone)
                if (result.error) {
                    return res.status(result.error.status).json({ error: result.error.message })
                }

                const { userId, organizationId, context } = result
                const channels = await getAvailableChannels(context, userId, organizationId)
                const allowedChannels = channels.map(s => s.name)

                const token = jwt.sign(
                    { userId, organizationId, allowedChannels },
                    TOKEN_SECRET,
                    { expiresIn: '24h' }
                )

                return res.json({ token, allowedChannels })
            } catch (error) {
                logger.error({ msg: 'Failed to generate token', err: error })
                return res.status(500).json({ error: 'Failed to generate token' })
            }
        })

        return app
    }
}

module.exports = { MessagingMiddleware }
