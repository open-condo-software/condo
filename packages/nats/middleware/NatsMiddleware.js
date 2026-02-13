const express = require('express')
const jwt = require('jsonwebtoken')
const nextCookie = require('next-cookies')

const conf = require('@open-condo/config')

const { checkNatsAccess, getAvailableStreams } = require('../utils/natsAuthCallout')

const TOKEN_SECRET = conf.NATS_TOKEN_SECRET || conf.TOKEN_SECRET || 'dev-secret'

class NatsMiddleware {
    prepareMiddleware ({ keystone }) {
        const app = express()
        app.use(express.json())

        app.get('/nats/streams', async (req, res) => {
            try {
                const user = req.user
                const userId = user?.id

                if (!userId) {
                    return res.status(401).json({ error: 'Not authenticated' })
                }

                const cookies = nextCookie({ req })
                const employeeId = cookies.organizationLinkId

                if (!employeeId) {
                    return res.status(401).json({ error: 'No organization selected' })
                }

                const context = await keystone.createContext({ skipAccessControl: true })

                const employee = await context.executeGraphQL({
                    query: `
                        query getEmployee($id: ID!) {
                            employee: OrganizationEmployee(where: { id: $id }) {
                                id
                                organization {
                                    id
                                }
                                user {
                                    id
                                }
                            }
                        }
                    `,
                    variables: { id: employeeId },
                })

                const employeeData = employee?.data?.employee

                if (!employeeData || employeeData.user?.id !== userId) {
                    return res.status(403).json({ error: 'Invalid organization selection' })
                }

                const organizationId = employeeData.organization?.id

                if (!organizationId) {
                    return res.status(500).json({ error: 'Organization not found' })
                }

                const streams = await getAvailableStreams(context, userId, organizationId)

                return res.json({ streams, organizationId })
            } catch (error) {
                console.error('[NATS Streams] Error:', error)
                return res.status(500).json({ error: 'Failed to get available streams' })
            }
        })

        app.get('/nats/token', async (req, res) => {
            try {
                const user = req.user
                const userId = user?.id

                if (!userId) {
                    return res.status(401).json({ error: 'Not authenticated' })
                }

                const cookies = nextCookie({ req })
                const employeeId = cookies.organizationLinkId

                if (!employeeId) {
                    return res.status(401).json({ error: 'No organization selected' })
                }

                const context = await keystone.createContext({ skipAccessControl: true })

                const employee = await context.executeGraphQL({
                    query: `
                        query getEmployee($id: ID!) {
                            employee: OrganizationEmployee(where: { id: $id }) {
                                id
                                organization {
                                    id
                                }
                                user {
                                    id
                                }
                            }
                        }
                    `,
                    variables: { id: employeeId },
                })

                const employeeData = employee?.data?.employee

                if (!employeeData || employeeData.user?.id !== userId) {
                    return res.status(403).json({ error: 'Invalid organization selection' })
                }

                const organizationId = employeeData.organization?.id

                if (!organizationId) {
                    return res.status(500).json({ error: 'Organization not found' })
                }

                const token = jwt.sign(
                    { userId, organizationId },
                    TOKEN_SECRET,
                    { expiresIn: '24h' }
                )

                return res.json({ token })
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
                        account: '$G',
                    })
                }

                const decoded = jwt.verify(token, TOKEN_SECRET)
                const { userId, organizationId } = decoded

                if (!userId || !organizationId) {
                    return res.status(200).json({ 
                        allowed: false, 
                        reason: 'Invalid token payload',
                        account: '$G',
                    })
                }

                const context = await keystone.createContext({ skipAccessControl: true })
                const result = await checkNatsAccess(context, userId, organizationId, subject)

                return res.status(200).json({
                    ...result,
                    account: '$G',
                })
            } catch (error) {
                console.error('[NATS Auth] Error:', error)
                return res.status(200).json({ 
                    allowed: false, 
                    reason: 'Invalid token',
                    account: '$G',
                })
            }
        })

        return app
    }
}

module.exports = { NatsMiddleware }
