const jwt = require('jsonwebtoken')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { makeLoggedInAdminClient, makeClient } = require('@open-condo/keystone/test.utils')
const { streamRegistry, configure } = require('@open-condo/nats')

const { getEmployedOrRelatedOrganizationsByPermissions } = require('@condo/domains/organization/utils/accessSchema')
const { createTestOrganization, createTestOrganizationEmployee, createTestOrganizationEmployeeRole } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')


const TOKEN_SECRET = conf.NATS_TOKEN_SECRET || conf.TOKEN_SECRET || 'dev-secret'

async function getCookieWithOrganization (client) {
    const baseCookie = client.getCookie()
    let employeeId = client.organization?.employeeId

    if (!employeeId && client.organization?.id && client.user?.id) {
        const { OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')
        const keystone = getSchemaCtx('User').keystone
        const context = await keystone.createContext({ skipAccessControl: true })

        const employees = await OrganizationEmployee.getAll(context, {
            organization: { id: client.organization.id },
            user: { id: client.user.id },
            deletedAt: null,
        })

        if (employees.length > 0) {
            employeeId = employees[0].id
            client.organization.employeeId = employeeId
        }
    }

    if (!employeeId) {
        return baseCookie
    }
    return `${baseCookie}; organizationLinkId=${employeeId}`
}

describe('NATS Middleware Integration Tests', () => {
    let admin
    let serverUrl
    let natsTokenUrl
    let natsStreamsUrl
    let natsAuthUrl

    beforeAll(async () => {
        configure({
            getPermittedOrganizations: getEmployedOrRelatedOrganizationsByPermissions,
        })
        admin = await makeLoggedInAdminClient()
        const client = await makeClient()
        serverUrl = client.serverUrl
        natsTokenUrl = serverUrl + '/nats/token'
        natsStreamsUrl = serverUrl + '/nats/streams'
        natsAuthUrl = serverUrl + '/nats/auth'

        // Register test streams
        streamRegistry.register('test-integration-changes', {
            ttl: 3600,
            subjects: ['test-integration-changes.>'],
            access: {
                read: 'canManageTickets',
            },
        })

        streamRegistry.register('test-public-integration-events', {
            ttl: 3600,
            subjects: ['test-public-integration-events.>'],
            access: {
                read: true,
            },
        })
    })

    describe('GET /nats/token - Token Generation Endpoint', () => {
        it('denies access without authentication cookie', async () => {
            const response = await fetch(natsTokenUrl, {
                method: 'GET',
            })

            expect(response.status).toBe(401)
            const body = await response.json()
            expect(body.error).toBe('Not authenticated')
        })

        it('denies access without organizationLinkId cookie', async () => {
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            const cookie = client.getCookie()

            const response = await fetch(natsTokenUrl, {
                method: 'GET',
                headers: { Cookie: cookie },
            })

            expect(response.status).toBe(401)
            const body = await response.json()
            expect(body.error).toBe('No organization selected')
        })

        it('generates valid JWT token for authenticated user with organization', async () => {
            const client = await makeClientWithProperty()
            const cookie = await getCookieWithOrganization(client)

            const response = await fetch(natsTokenUrl, {
                method: 'GET',
                headers: { Cookie: cookie },
            })

            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body.token).toBeDefined()

            const decoded = jwt.verify(body.token, TOKEN_SECRET)
            expect(decoded.userId).toBe(client.user.id)
            expect(decoded.organizationId).toBe(client.organization.id)
            expect(decoded.exp).toBeDefined()
        })

        it('denies access when organizationLinkId does not belong to user', async () => {
            const client1 = await makeClientWithProperty()
            const client2 = await makeClientWithProperty()

            const cookie1 = client1.getCookie()
            const orgLinkId2 = client2.organization.employeeId

            const cookieWithWrongOrg = `${cookie1}; organizationLinkId=${orgLinkId2}`

            const response = await fetch(natsTokenUrl, {
                method: 'GET',
                headers: { Cookie: cookieWithWrongOrg },
            })

            expect(response.status).toBe(403)
            const body = await response.json()
            expect(body.error).toBe('Invalid organization selection')
        })
    })

    describe('GET /nats/streams - Available Streams Endpoint', () => {
        it('denies access without authentication', async () => {
            const response = await fetch(natsStreamsUrl, {
                method: 'GET',
            })

            expect(response.status).toBe(401)
            const body = await response.json()
            expect(body.error).toBe('Not authenticated')
        })

        it('denies access without organizationLinkId cookie', async () => {
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            const cookie = client.getCookie()

            const response = await fetch(natsStreamsUrl, {
                method: 'GET',
                headers: { Cookie: cookie },
            })

            expect(response.status).toBe(401)
            const body = await response.json()
            expect(body.error).toBe('No organization selected')
        })

        it('returns available streams for authenticated user', async () => {
            const client = await makeClientWithProperty()
            const cookie = await getCookieWithOrganization(client)

            const response = await fetch(natsStreamsUrl, {
                method: 'GET',
                headers: { Cookie: cookie },
            })

            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body.streams).toBeDefined()
            expect(Array.isArray(body.streams)).toBe(true)
            expect(body.organizationId).toBe(client.organization.id)

            const streamNames = body.streams.map(s => s.name)
            expect(streamNames).toContain('test-integration-changes')
            expect(streamNames).toContain('test-public-integration-events')
        })

        it('returns only streams user has permission for', async () => {
            const [organization] = await createTestOrganization(admin)
            const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                canManageTickets: false,
            })
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            const [employee] = await createTestOrganizationEmployee(admin, organization, client.user, role, {
                isRejected: false,
                isAccepted: true,
                isBlocked: false,
            })

            client.organization = { ...organization, employeeId: employee.id }
            const cookie = await getCookieWithOrganization(client)

            const response = await fetch(natsStreamsUrl, {
                method: 'GET',
                headers: { Cookie: cookie },
            })

            expect(response.status).toBe(200)
            const body = await response.json()
            const streamNames = body.streams.map(s => s.name)

            expect(streamNames).toContain('test-public-integration-events')
            expect(streamNames).not.toContain('test-integration-changes')
        })
    })

    describe('POST /nats/auth - Authorization Callout Endpoint', () => {
        it('denies access without token', async () => {
            const response = await fetch(natsAuthUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connect_opts: {},
                    client_metadata: { subject: 'test-integration-stream.test.message' },
                }),
            })

            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body.allowed).toBe(false)
            expect(body.reason).toBe('No token provided')
        })

        it('denies access with invalid token signature', async () => {
            const invalidToken = jwt.sign(
                { userId: 'fake-user', organizationId: 'fake-org' },
                'wrong-secret',
                { expiresIn: '24h' }
            )

            const response = await fetch(natsAuthUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connect_opts: { auth_token: invalidToken },
                    client_metadata: { subject: 'test-integration-stream.test.message' },
                }),
            })

            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body.allowed).toBe(false)
            expect(body.reason).toBe('Invalid token')
        })

        it('denies access with expired token', async () => {
            const client = await makeClientWithProperty()

            const expiredToken = jwt.sign(
                { userId: client.user.id, organizationId: client.organization.id },
                TOKEN_SECRET,
                { expiresIn: '1ms' }
            )

            await new Promise(resolve => setTimeout(resolve, 100))

            const response = await fetch(natsAuthUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connect_opts: { auth_token: expiredToken },
                    client_metadata: { subject: 'test-integration-stream.test.message' },
                }),
            })

            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body.allowed).toBe(false)
            expect(body.reason).toBe('Invalid token')
        })

        it('denies access when user lacks required permission', async () => {
            const [organization] = await createTestOrganization(admin)
            const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                canManageTickets: false,
            })
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            await createTestOrganizationEmployee(admin, organization, client.user, role, {
                isRejected: false,
                isAccepted: true,
                isBlocked: false,
            })

            const token = jwt.sign(
                { userId: client.user.id, organizationId: organization.id },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const response = await fetch(natsAuthUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connect_opts: { auth_token: token },
                    client_metadata: { subject: 'test-integration-changes.test.message' },
                }),
            })

            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body.allowed).toBe(false)
            expect(body.reason).toBe('Permission denied')
        })

        it('allows access when user has required permission', async () => {
            const [organization] = await createTestOrganization(admin)
            const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                canManageTickets: true,
            })
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            await createTestOrganizationEmployee(admin, organization, client.user, role, {
                isRejected: false,
                isAccepted: true,
                isBlocked: false,
            })

            const token = jwt.sign(
                { userId: client.user.id, organizationId: organization.id },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const response = await fetch(natsAuthUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connect_opts: { auth_token: token },
                    client_metadata: { subject: 'test-integration-changes.test.message' },
                }),
            })

            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body.allowed).toBe(true)
            expect(body.user).toBe(client.user.id)
            expect(body.organization).toBe(organization.id)
        })

        it('allows access to public streams without permissions', async () => {
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await createTestOrganization(admin)
            const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                canManageTickets: false,
            })
            await createTestOrganizationEmployee(admin, organization, client.user, role, {
                isRejected: false,
                isAccepted: true,
                isBlocked: false,
            })

            const token = jwt.sign(
                { userId: client.user.id, organizationId: organization.id },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const response = await fetch(natsAuthUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connect_opts: { auth_token: token },
                    client_metadata: { subject: 'test-public-integration-events.test.message' },
                }),
            })

            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body.allowed).toBe(true)
        })

        it('denies access to non-existent streams', async () => {
            const client = await makeClientWithProperty()

            const token = jwt.sign(
                { userId: client.user.id, organizationId: client.organization.id },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const response = await fetch(natsAuthUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connect_opts: { auth_token: token },
                    client_metadata: { subject: 'non-existent-stream.test.message' },
                }),
            })

            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body.allowed).toBe(false)
            expect(body.reason).toBe('Stream not found')
        })

        it('denies access with custom function when ticket belongs to different organization', async () => {
            streamRegistry.register('test-custom-integration-events', {
                ttl: 3600,
                subjects: ['test-custom-integration-events.>'],
                access: {
                    read: async ({ authentication, context, organizationId, subject }) => {
                        const { item: user } = authentication
                        if (!user || user.deletedAt) return false

                        const ticketId = subject.split('.')[2]
                        if (!ticketId) return false

                        const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')
                        const ticket = await Ticket.getOne(context, {
                            id: ticketId,
                            organization: { id: organizationId },
                        })

                        if (!ticket) return false

                        const { getEmployedOrRelatedOrganizationsByPermissions } = require('@condo/domains/organization/utils/accessSchema')
                        const permittedOrganizations = await getEmployedOrRelatedOrganizationsByPermissions(context, user, ['canReadTickets'])
                        return permittedOrganizations.includes(organizationId)
                    },
                },
            })

            const client1 = await makeClientWithProperty()
            const client2 = await makeClientWithProperty()
            const [ticket] = await createTestTicket(client1, client1.organization, client1.property)

            const token = jwt.sign(
                { userId: client2.user.id, organizationId: client2.organization.id },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const response = await fetch(natsAuthUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connect_opts: { auth_token: token },
                    client_metadata: { subject: `test-custom-integration-stream.${client1.organization.id}.${ticket.id}` },
                }),
            })

            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body.allowed).toBe(false)
        })

        it('allows access with custom function when user has permission for ticket', async () => {
            const client = await makeClientWithProperty()
            const [ticket] = await createTestTicket(client, client.organization, client.property)

            const token = jwt.sign(
                { userId: client.user.id, organizationId: client.organization.id },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const response = await fetch(natsAuthUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connect_opts: { auth_token: token },
                    client_metadata: { subject: `test-custom-integration-events.${client.organization.id}.${ticket.id}` },
                }),
            })

            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body.allowed).toBe(true)
            expect(body.user).toBe(client.user.id)
            expect(body.organization).toBe(client.organization.id)
        })
    })

    describe('End-to-End Security Flow', () => {
        it('full flow: token generation -> authorization -> access grant', async () => {
            const client = await makeClientWithProperty()
            const [ticket] = await createTestTicket(client, client.organization, client.property)
            const cookie = await getCookieWithOrganization(client)

            const tokenResponse = await fetch(natsTokenUrl, {
                method: 'GET',
                headers: { Cookie: cookie },
            })

            expect(tokenResponse.status).toBe(200)
            const { token } = await tokenResponse.json()
            expect(token).toBeDefined()

            const authResponse = await fetch(natsAuthUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connect_opts: { auth_token: token },
                    client_metadata: { subject: `test-custom-integration-events.${client.organization.id}.${ticket.id}` },
                }),
            })

            expect(authResponse.status).toBe(200)
            const authBody = await authResponse.json()
            expect(authBody.allowed).toBe(true)
            expect(authBody.user).toBe(client.user.id)
            expect(authBody.organization).toBe(client.organization.id)
        })

        it('full flow: denies when user tries to access another organizations resources', async () => {
            const client1 = await makeClientWithProperty()
            const client2 = await makeClientWithProperty()
            const [ticket] = await createTestTicket(client1, client1.organization, client1.property)
            const cookie2 = await getCookieWithOrganization(client2)

            const tokenResponse = await fetch(natsTokenUrl, {
                method: 'GET',
                headers: { Cookie: cookie2 },
            })

            expect(tokenResponse.status).toBe(200)
            const { token } = await tokenResponse.json()

            const authResponse = await fetch(natsAuthUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connect_opts: { auth_token: token },
                    client_metadata: { subject: `test-custom-integration-stream.${client1.organization.id}.${ticket.id}` },
                }),
            })

            expect(authResponse.status).toBe(200)
            const authBody = await authResponse.json()
            expect(authBody.allowed).toBe(false)
        })
    })
})
