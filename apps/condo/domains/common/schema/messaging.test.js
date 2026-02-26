const jwt = require('jsonwebtoken')
const { connect, JSONCodec, createInbox } = require('nats')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { makeLoggedInAdminClient, makeClient } = require('@open-condo/keystone/test.utils')
const { configure } = require('@open-condo/messaging')

const { isActiveEmployee } = require('@condo/domains/common/utils/initMessaging')
const { OrganizationEmployee, createTestOrganization, createTestOrganizationEmployee, createTestOrganizationEmployeeRole, updateTestOrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const TOKEN_SECRET = conf.MESSAGING_TOKEN_SECRET
const BROKER_URL = conf.MESSAGING_BROKER_URL
const MESSAGING_CONFIGURED = conf.MESSAGING_ENABLED === 'true' && !!conf.MESSAGING_AUTH_ACCOUNT_SEED

function expectGQLError (body, expectedType) {
    expect(body.errors).toBeDefined()
    expect(body.errors).toHaveLength(1)
    expect(body.errors[0]).toEqual(expect.objectContaining({
        name: 'GQLError',
        extensions: expect.objectContaining({
            type: expectedType,
        }),
    }))
}

async function getCookieWithOrganization (client, adminClient) {
    const baseCookie = client.getCookie()
    let employeeId = client.organization?.employeeId

    if (!employeeId && client.organization?.id && client.user?.id) {
        const employees = await OrganizationEmployee.getAll(adminClient, {
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

describe('Messaging Integration Tests', () => {
    let admin
    let serverUrl
    let natsTokenUrl
    let natsStreamsUrl

    beforeAll(async () => {
        configure({
            isActiveEmployee,
        })
        admin = await makeLoggedInAdminClient()
        const client = await makeClient()
        serverUrl = client.serverUrl
        natsTokenUrl = serverUrl + '/messaging/token'
        natsStreamsUrl = serverUrl + '/messaging/channels'
    })

    describe('GET /messaging/token - Token Generation Endpoint', () => {
        it('denies access without authentication cookie', async () => {
            const response = await fetch(natsTokenUrl, {
                method: 'GET',
            })

            expect(response.status).toBe(401)
            const body = await response.json()
            expectGQLError(body, 'AUTHORIZATION_REQUIRED')
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
            expectGQLError(body, 'NO_ORGANIZATION_SELECTED')
        })

        it('generates valid JWT token for authenticated user with organization', async () => {
            const client = await makeClientWithProperty()
            const cookie = await getCookieWithOrganization(client, admin)

            const response = await fetch(natsTokenUrl, {
                method: 'GET',
                headers: { Cookie: cookie },
            })

            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body.token).toBeDefined()
            expect(body.userId).toBe(client.user.id)
            expect(body.organizationId).toBe(client.organization.id)

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
            expectGQLError(body, 'INVALID_ORGANIZATION_SELECTION')
        })
    })

    describe('GET /messaging/channels - Available Channels Endpoint', () => {
        it('denies access without authentication', async () => {
            const response = await fetch(natsStreamsUrl, {
                method: 'GET',
            })

            expect(response.status).toBe(401)
            const body = await response.json()
            expectGQLError(body, 'AUTHORIZATION_REQUIRED')
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
            expectGQLError(body, 'NO_ORGANIZATION_SELECTED')
        })

        it('returns available channels for authenticated user', async () => {
            const client = await makeClientWithProperty()
            const cookie = await getCookieWithOrganization(client, admin)

            const response = await fetch(natsStreamsUrl, {
                method: 'GET',
                headers: { Cookie: cookie },
            })

            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body.channels).toBeDefined()
            expect(Array.isArray(body.channels)).toBe(true)
            expect(body.organizationId).toBe(client.organization.id)
            expect(body.userId).toBe(client.user.id)

            const channelNames = body.channels.map(s => s.name)
            expect(channelNames).toContain('user')
            expect(channelNames).toContain('organization')
            expect(body.channels).toHaveLength(2)
        })
    })

    describe('End-to-End Security Flow', () => {
        it('token includes correct claims for authenticated user', async () => {
            const client = await makeClientWithProperty()
            const cookie = await getCookieWithOrganization(client, admin)

            const tokenResponse = await fetch(natsTokenUrl, {
                method: 'GET',
                headers: { Cookie: cookie },
            })

            expect(tokenResponse.status).toBe(200)
            const { token, userId, organizationId } = await tokenResponse.json()
            expect(token).toBeDefined()
            expect(userId).toBe(client.user.id)
            expect(organizationId).toBe(client.organization.id)

            const decoded = jwt.verify(token, TOKEN_SECRET)
            expect(decoded.userId).toBe(client.user.id)
            expect(decoded.organizationId).toBe(client.organization.id)
        })
    })

    const describeIfNats = MESSAGING_CONFIGURED ? describe : describe.skip

    describeIfNats('Full NATS Socket Integration', () => {
        async function getTokenForClient (client) {
            const cookie = await getCookieWithOrganization(client, admin)
            const response = await fetch(natsTokenUrl, {
                method: 'GET',
                headers: { Cookie: cookie },
            })
            expect(response.status).toBe(200)
            const body = await response.json()
            return body.token
        }

        it('connects to NATS with real token from /messaging/token', async () => {
            const client = await makeClientWithProperty()
            const token = await getTokenForClient(client)

            const nc = await connect({ servers: BROKER_URL, token, name: 'socket-connect-test', timeout: 5000 })
            try {
                expect(nc).toBeDefined()
            } finally {
                await nc.close()
            }
        })

        it('relay request for own org succeeds', async () => {
            const client = await makeClientWithProperty()
            const token = await getTokenForClient(client)

            const nc = await connect({ servers: BROKER_URL, token, name: 'socket-relay-own', timeout: 5000 })
            const jc = JSONCodec()
            try {
                const deliverInbox = createInbox()
                nc.subscribe(deliverInbox)
                const response = await nc.request(
                    `_MESSAGING.subscribe.organization.${client.organization.id}.ticket`,
                    jc.encode({ deliverInbox }),
                    { timeout: 5000 }
                )
                const data = jc.decode(response.data)
                expect(data.status).toBe('ok')
                expect(data.relayId).toBeDefined()
            } finally {
                await nc.close()
            }
        }, 15000)

        it('relay request for another org is DENIED by PUB permission', async () => {
            const clientA = await makeClientWithProperty()
            const clientB = await makeClientWithProperty()
            const tokenA = await getTokenForClient(clientA)

            const nc = await connect({ servers: BROKER_URL, token: tokenA, name: 'socket-relay-cross', timeout: 5000 })
            const jc = JSONCodec()
            try {
                await expect(nc.request(
                    `_MESSAGING.subscribe.organization.${clientB.organization.id}.ticket`,
                    jc.encode({ deliverInbox: createInbox() }),
                    { timeout: 2000 }
                )).rejects.toThrow()
            } finally {
                await nc.close()
            }
        }, 15000)

        it('end-to-end: relay delivers ONLY own-org messages', async () => {
            const clientA = await makeClientWithProperty()
            const clientB = await makeClientWithProperty()
            const tokenA = await getTokenForClient(clientA)

            const serverConn = await connect({
                servers: BROKER_URL,
                user: conf.MESSAGING_SERVER_USER,
                pass: conf.MESSAGING_SERVER_PASSWORD,
                name: 'test-publisher',
            })

            let nc
            try {
                nc = await connect({ servers: BROKER_URL, token: tokenA, name: 'socket-e2e', timeout: 5000 })
                const jc = JSONCodec()

                const deliverInbox = createInbox()
                const received = []
                const inboxSub = nc.subscribe(deliverInbox)
                const done = (async () => {
                    for await (const msg of inboxSub) {
                        received.push(jc.decode(msg.data))
                    }
                })()

                const response = await nc.request(
                    `_MESSAGING.subscribe.organization.${clientA.organization.id}.ticket`,
                    jc.encode({ deliverInbox }),
                    { timeout: 5000 }
                )
                expect(jc.decode(response.data).status).toBe('ok')

                await new Promise(resolve => setTimeout(resolve, 300))

                serverConn.publish(
                    `organization.${clientA.organization.id}.ticket`,
                    jc.encode({ org: clientA.organization.id, id: 'e1' })
                )
                serverConn.publish(
                    `organization.${clientB.organization.id}.ticket`,
                    jc.encode({ org: clientB.organization.id, id: 'e2' })
                )
                await serverConn.flush()

                await new Promise(resolve => setTimeout(resolve, 1000))
                inboxSub.unsubscribe()
                await done

                expect(received.length).toBeGreaterThanOrEqual(1)
                expect(received.every(m => m.org === clientA.organization.id)).toBe(true)
                expect(received.find(m => m.org === clientB.organization.id)).toBeUndefined()
            } finally {
                if (nc) await nc.close()
                await serverConn.close()
            }
        }, 20000)

        it('cross-user isolation: two users with separate tokens only see own org messages', async () => {
            const clientA = await makeClientWithProperty()
            const clientB = await makeClientWithProperty()
            const tokenA = await getTokenForClient(clientA)
            const tokenB = await getTokenForClient(clientB)

            const serverConn = await connect({
                servers: BROKER_URL,
                user: conf.MESSAGING_SERVER_USER,
                pass: conf.MESSAGING_SERVER_PASSWORD,
                name: 'cross-user-publisher',
            })

            let ncA, ncB
            try {
                ncA = await connect({ servers: BROKER_URL, token: tokenA, name: 'user-a', timeout: 5000 })
                ncB = await connect({ servers: BROKER_URL, token: tokenB, name: 'user-b', timeout: 5000 })
                const jc = JSONCodec()

                const inboxA = createInbox()
                const inboxB = createInbox()
                const receivedA = []
                const receivedB = []

                const subA = ncA.subscribe(inboxA)
                const doneA = (async () => {
                    for await (const msg of subA) {
                        receivedA.push(jc.decode(msg.data))
                    }
                })()

                const subB = ncB.subscribe(inboxB)
                const doneB = (async () => {
                    for await (const msg of subB) {
                        receivedB.push(jc.decode(msg.data))
                    }
                })()

                const respA = await ncA.request(
                    `_MESSAGING.subscribe.organization.${clientA.organization.id}.ticket`,
                    jc.encode({ deliverInbox: inboxA }),
                    { timeout: 5000 }
                )
                expect(jc.decode(respA.data).status).toBe('ok')

                const respB = await ncB.request(
                    `_MESSAGING.subscribe.organization.${clientB.organization.id}.ticket`,
                    jc.encode({ deliverInbox: inboxB }),
                    { timeout: 5000 }
                )
                expect(jc.decode(respB.data).status).toBe('ok')

                // User A CANNOT subscribe to User B's org
                await expect(ncA.request(
                    `_MESSAGING.subscribe.organization.${clientB.organization.id}.ticket`,
                    jc.encode({ deliverInbox: inboxA }),
                    { timeout: 2000 }
                )).rejects.toThrow()

                // User B CANNOT subscribe to User A's org
                await expect(ncB.request(
                    `_MESSAGING.subscribe.organization.${clientA.organization.id}.ticket`,
                    jc.encode({ deliverInbox: inboxB }),
                    { timeout: 2000 }
                )).rejects.toThrow()

                await new Promise(resolve => setTimeout(resolve, 300))

                serverConn.publish(
                    `organization.${clientA.organization.id}.ticket`,
                    jc.encode({ org: clientA.organization.id, from: 'for-A' })
                )
                serverConn.publish(
                    `organization.${clientB.organization.id}.ticket`,
                    jc.encode({ org: clientB.organization.id, from: 'for-B' })
                )
                await serverConn.flush()

                await new Promise(resolve => setTimeout(resolve, 1000))
                subA.unsubscribe()
                subB.unsubscribe()
                await doneA
                await doneB

                // User A only received their own org's messages
                expect(receivedA.length).toBeGreaterThanOrEqual(1)
                expect(receivedA.every(m => m.org === clientA.organization.id)).toBe(true)
                expect(receivedA.some(m => m.org === clientB.organization.id)).toBe(false)

                // User B only received their own org's messages
                expect(receivedB.length).toBeGreaterThanOrEqual(1)
                expect(receivedB.every(m => m.org === clientB.organization.id)).toBe(true)
                expect(receivedB.some(m => m.org === clientA.organization.id)).toBe(false)
            } finally {
                if (ncA) await ncA.close()
                if (ncB) await ncB.close()
                await serverConn.close()
            }
        }, 30000)

        it('forged token is rejected at NATS level', async () => {
            const forgedToken = jwt.sign(
                { userId: 'fake-user', organizationId: 'fake-org' },
                // intentionally wrong secret to test that forged tokens are rejected
                // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret
                'wrong-secret',
                { expiresIn: '1h' }
            )
            await expect(
                connect({ servers: BROKER_URL, token: forgedToken, name: 'forged', timeout: 5000 })
            ).rejects.toThrow()
        })

        it('connection without token is rejected', async () => {
            await expect(
                connect({ servers: BROKER_URL, name: 'no-token', timeout: 5000 })
            ).rejects.toThrow()
        })

        it('blocking employee instantly revokes active relay subscription', async () => {
            const client = await makeClientWithProperty()
            const token = await getTokenForClient(client)

            const serverConn = await connect({
                servers: BROKER_URL,
                user: conf.MESSAGING_SERVER_USER,
                pass: conf.MESSAGING_SERVER_PASSWORD,
                name: 'revoke-publisher',
            })

            let nc
            try {
                nc = await connect({ servers: BROKER_URL, token, name: 'revoke-target', timeout: 5000 })
                const jc = JSONCodec()

                // 1. Set up relay subscription and verify it works
                const deliverInbox = createInbox()
                const received = []
                const inboxSub = nc.subscribe(deliverInbox)
                const done = (async () => {
                    for await (const msg of inboxSub) {
                        received.push(jc.decode(msg.data))
                    }
                })()

                const response = await nc.request(
                    `_MESSAGING.subscribe.user.${client.user.id}.notification`,
                    jc.encode({ deliverInbox }),
                    { timeout: 5000 }
                )
                expect(jc.decode(response.data).status).toBe('ok')

                await new Promise(resolve => setTimeout(resolve, 300))

                // Publish a message — should be received
                serverConn.publish(
                    `user.${client.user.id}.notification`,
                    jc.encode({ id: 'before-block', operation: 'create' })
                )
                await serverConn.flush()
                await new Promise(resolve => setTimeout(resolve, 500))

                expect(received.length).toBe(1)
                expect(received[0].id).toBe('before-block')

                // 2. Block the employee via Keystone API
                const employees = await OrganizationEmployee.getAll(admin, {
                    organization: { id: client.organization.id },
                    user: { id: client.user.id },
                    deletedAt: null,
                })
                expect(employees).toHaveLength(1)
                await updateTestOrganizationEmployee(admin, employees[0].id, {
                    isBlocked: true,
                })

                // Publish revocation via NATS (in production, adapter.revokeUser does this)
                serverConn.publish(`_MESSAGING.admin.revoke.${client.user.id}`)
                await serverConn.flush()
                await new Promise(resolve => setTimeout(resolve, 500))

                // 3. Publish another message — should NOT be received (relay torn down)
                serverConn.publish(
                    `user.${client.user.id}.notification`,
                    jc.encode({ id: 'after-block', operation: 'update' })
                )
                await serverConn.flush()
                await new Promise(resolve => setTimeout(resolve, 1000))

                inboxSub.unsubscribe()
                await done

                // Only the pre-block message should have been received
                const postBlockMessages = received.filter(m => m.id === 'after-block')
                expect(postBlockMessages).toHaveLength(0)

                // 4. New relay request should also be rejected
                const deliverInbox2 = createInbox()
                nc.subscribe(deliverInbox2)
                const retryResponse = await nc.request(
                    `_MESSAGING.subscribe.user.${client.user.id}.notification`,
                    jc.encode({ deliverInbox: deliverInbox2 }),
                    { timeout: 5000 }
                )
                const retryData = jc.decode(retryResponse.data)
                expect(retryData.status).toBe('error')
                expect(retryData.reason).toBe('access revoked')
            } finally {
                if (nc) await nc.close()
                await serverConn.close()
            }
        }, 30000)
    })
})
