const express = require('express')
const jwt = require('jsonwebtoken')
const nextCookie = require('next-cookies')

const conf = require('@open-condo/config')

const { checkNatsAccess, getAvailableStreams } = require('../utils/natsAuthCallout')

const TOKEN_SECRET = conf.NATS_TOKEN_SECRET || conf.TOKEN_SECRET || 'dev-secret'

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

class NatsMiddleware {
    prepareMiddleware ({ keystone }) {
        // internal Keystone middleware for NATS token/auth endpoints, not a standalone user-facing Express app
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.use(express.json())

        app.get('/nats/streams', async (req, res) => {
            try {
                const result = await resolveEmployeeContext(req, keystone)
                if (result.error) {
                    return res.status(result.error.status).json({ error: result.error.message })
                }

                const { userId, organizationId, context } = result
                const streams = await getAvailableStreams(context, userId, organizationId)

                return res.json({ streams, organizationId })
            } catch (error) {
                console.error('[NATS Streams] Error:', error)
                return res.status(500).json({ error: 'Failed to get available streams' })
            }
        })

        app.get('/nats/token', async (req, res) => {
            try {
                const result = await resolveEmployeeContext(req, keystone)
                if (result.error) {
                    return res.status(result.error.status).json({ error: result.error.message })
                }

                const { userId, organizationId, context } = result
                const streams = await getAvailableStreams(context, userId, organizationId)
                const allowedStreams = streams.map(s => s.name)

                const token = jwt.sign(
                    { userId, organizationId, allowedStreams },
                    TOKEN_SECRET,
                    { expiresIn: '24h' }
                )

                return res.json({ token, allowedStreams })
            } catch (error) {
                console.error('[NATS Token] Error:', error)
                return res.status(500).json({ error: 'Failed to generate token' })
            }
        })

        app.post('/nats/auth', async (req, res) => {
            try {
                const { connect_opts, client_metadata } = req.body
                const token = connect_opts?.auth_token || connect_opts?.jwt
                const subject = client_metadata?.subject

                if (!token) {
                    return res.status(200).json({
                        allowed: false,
                        reason: 'No token provided',
                        account: 'APP',
                    })
                }

                const decoded = jwt.verify(token, TOKEN_SECRET)
                const { userId, organizationId } = decoded

                if (!userId || !organizationId) {
                    return res.status(200).json({
                        allowed: false,
                        reason: 'Invalid token payload',
                        account: 'APP',
                    })
                }

                const context = await keystone.createContext({ skipAccessControl: true })
                const accessResult = await checkNatsAccess(context, userId, organizationId, subject)

                return res.status(200).json({
                    ...accessResult,
                    account: 'APP',
                })
            } catch (error) {
                console.error('[NATS Auth] Error:', error)
                return res.status(200).json({
                    allowed: false,
                    reason: 'Invalid token',
                    account: 'APP',
                })
            }
        })

        return app
    }
}

module.exports = { NatsMiddleware }
