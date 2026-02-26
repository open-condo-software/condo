const jwt = require('jsonwebtoken')
const { connect, JSONCodec, createInbox } = require('nats')
const nkeys = require('nkeys.js')

const conf = require('@open-condo/config')
const { buildOrganizationTopic } = require('@open-condo/messaging')
const { NatsSubscriptionRelay } = require('@open-condo/messaging/adapters/nats')
const {
    decodeNatsJwt,
    createUserJwt,
    createAuthResponseJwt,
    computePermissions,
} = require('@open-condo/messaging/adapters/nats')

const TOKEN_SECRET = conf.MESSAGING_TOKEN_SECRET
const BROKER_URL = conf.MESSAGING_BROKER_URL

describe('Messaging PUB-gated Relay Access Control Integration', () => {
    let authConnection
    let accountKeyPair
    let accountPublicKey
    let relayService

    beforeAll(async () => {
        const seed = conf.MESSAGING_AUTH_ACCOUNT_SEED

        accountKeyPair = nkeys.fromSeed(Buffer.from(seed))
        accountPublicKey = accountKeyPair.getPublicKey()

        authConnection = await connect({
            servers: BROKER_URL,
            user: conf.MESSAGING_AUTH_USER,
            pass: conf.MESSAGING_AUTH_PASSWORD,
            name: 'test-auth-callout',
        })

        const sub = authConnection.subscribe('$SYS.REQ.USER.AUTH')
        ;(async () => {
            for await (const msg of sub) {
                try {
                    const raw = new TextDecoder().decode(msg.data)
                    const requestClaims = decodeNatsJwt(raw)
                    const { connect_opts, user_nkey, server_id } = requestClaims.nats
                    const token = connect_opts?.auth_token || connect_opts?.token
                    const serverId = server_id?.id || ''

                    if (!token) {
                        msg.respond(new TextEncoder().encode(createAuthResponseJwt({
                            userNkey: user_nkey, serverId, accountPublicKey,
                            error: 'No token', signingConfig: { keyPair: accountKeyPair },
                        })))
                        continue
                    }

                    let decoded
                    try { decoded = jwt.verify(token, TOKEN_SECRET) } catch {
                        msg.respond(new TextEncoder().encode(createAuthResponseJwt({
                            userNkey: user_nkey, serverId, accountPublicKey,
                            error: 'Invalid token', signingConfig: { keyPair: accountKeyPair },
                        })))
                        continue
                    }

                    const { userId, organizationId } = decoded
                    if (!userId || !organizationId) {
                        msg.respond(new TextEncoder().encode(createAuthResponseJwt({
                            userNkey: user_nkey, serverId, accountPublicKey,
                            error: 'Access denied', signingConfig: { keyPair: accountKeyPair },
                        })))
                        continue
                    }

                    const permissions = computePermissions(userId, organizationId)
                    const userJwt = createUserJwt({
                        userNkey: user_nkey, accountPublicKey, permissions,
                        signingConfig: { keyPair: accountKeyPair }, accountName: 'APP',
                    })
                    msg.respond(new TextEncoder().encode(createAuthResponseJwt({
                        userNkey: user_nkey, serverId, accountPublicKey,
                        userJwt, signingConfig: { keyPair: accountKeyPair },
                    })))
                } catch (err) {
                    console.error('[Test Auth Callout] Error:', err)
                }
            }
        })()

        relayService = new NatsSubscriptionRelay()
        await relayService.start({
            url: BROKER_URL,
            user: conf.MESSAGING_SERVER_USER,
            pass: conf.MESSAGING_SERVER_PASSWORD,
        })
    }, 15000)

    afterAll(async () => {
        if (relayService) await relayService.stop()
        if (authConnection) {
            await authConnection.drain()
            await authConnection.close()
        }
    })

    function createToken (organizationId, userId = 'test-user') {
        return jwt.sign(
            { userId, organizationId },
            TOKEN_SECRET,
            { expiresIn: '1h' }
        )
    }

    async function connectWithToken (token, name) {
        return connect({ servers: BROKER_URL, token, name, timeout: 5000 })
    }

    describe('CRITICAL: PUB-gated relay cross-org isolation', () => {
        const ORG_A = 'test-org-aaaa-1111'
        const ORG_B = 'test-org-bbbb-2222'

        it('connects with org-A scoped token', async () => {
            const token = createToken(ORG_A)
            const nc = await connectWithToken(token, 'connect-test')
            try {
                expect(nc).toBeDefined()
            } finally {
                await nc.close()
            }
        })

        it('can publish relay request for own org (PUB allowed)', async () => {
            const token = createToken(ORG_A)
            const nc = await connectWithToken(token, 'relay-own-org')
            const jc = JSONCodec()
            try {
                const deliverInbox = createInbox()
                const sub = nc.subscribe(deliverInbox)
                const response = await nc.request(
                    `_MESSAGING.subscribe.organization.${ORG_A}.ticket`,
                    jc.encode({ deliverInbox }),
                    { timeout: 5000 }
                )
                const data = jc.decode(response.data)
                expect(data.status).toBe('ok')
                expect(data.relayId).toBeDefined()
                sub.unsubscribe()
            } finally {
                await nc.close()
            }
        })

        it('CANNOT publish relay request for different org (PUB denied)', async () => {
            const token = createToken(ORG_A)
            const nc = await connectWithToken(token, 'relay-cross-org')
            const jc = JSONCodec()
            try {
                const deliverInbox = createInbox()
                await expect(nc.request(
                    `_MESSAGING.subscribe.organization.${ORG_B}.ticket`,
                    jc.encode({ deliverInbox }),
                    { timeout: 2000 }
                )).rejects.toThrow()
            } finally {
                await nc.close()
            }
        })

        it('CANNOT use JetStream API (no PUB permission)', async () => {
            const token = createToken(ORG_A)
            const nc = await connectWithToken(token, 'no-jetstream')
            try {
                const js = nc.jetstream()
                await expect(js.streams.get('organization')).rejects.toThrow()
            } finally {
                await nc.close()
            }
        })

        it('relay delivers ONLY own-org messages to client INBOX', async () => {
            const serverConn = await connect({
                servers: BROKER_URL,
                user: conf.MESSAGING_SERVER_USER,
                pass: conf.MESSAGING_SERVER_PASSWORD,
                name: 'test-publisher-relay',
            })

            let nc
            try {
                const token = createToken(ORG_A)
                nc = await connectWithToken(token, 'relay-messages')
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
                    `_MESSAGING.subscribe.organization.${ORG_A}.ticket`,
                    jc.encode({ deliverInbox }),
                    { timeout: 5000 }
                )
                const relayData = jc.decode(response.data)
                expect(relayData.status).toBe('ok')

                await new Promise(resolve => setTimeout(resolve, 300))

                serverConn.publish(
                    buildOrganizationTopic(ORG_A, 'ticket'),
                    jc.encode({ org: ORG_A, id: 'ticket-aaa' })
                )
                serverConn.publish(
                    buildOrganizationTopic(ORG_B, 'ticket'),
                    jc.encode({ org: ORG_B, id: 'ticket-bbb' })
                )
                await serverConn.flush()

                await new Promise(resolve => setTimeout(resolve, 1000))
                inboxSub.unsubscribe()
                await done

                expect(received).toHaveLength(1)
                expect(received[0].org).toBe(ORG_A)
                expect(received[0].id).toBe('ticket-aaa')
            } finally {
                if (nc) await nc.close()
                await serverConn.close()
            }
        }, 15000)
    })

    describe('CRITICAL: Server-side access control — cross-organization isolation', () => {
        const ORG_A = 'test-org-aaaa-1111'
        const ORG_B = 'test-org-bbbb-2222'

        it('user with org-A token cannot relay for org-B (PUB enforced)', async () => {
            const token = createToken(ORG_A)
            const nc = await connectWithToken(token, 'cross-org-denied')
            const jc = JSONCodec()
            try {
                await expect(nc.request(
                    `_MESSAGING.subscribe.organization.${ORG_B}.ticket`,
                    jc.encode({ deliverInbox: createInbox() }),
                    { timeout: 2000 }
                )).rejects.toThrow()
            } finally {
                await nc.close()
            }
        })

        it('user cannot receive org-B messages via relay scoped to org-A', async () => {
            const serverConn = await connect({
                servers: BROKER_URL,
                user: conf.MESSAGING_SERVER_USER,
                pass: conf.MESSAGING_SERVER_PASSWORD,
                name: 'test-publisher-isolation',
            })

            let nc
            try {
                const token = createToken(ORG_A)
                nc = await connectWithToken(token, 'isolation-relay-verify')
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
                    `_MESSAGING.subscribe.organization.${ORG_A}.ticket`,
                    jc.encode({ deliverInbox }),
                    { timeout: 5000 }
                )
                expect(jc.decode(response.data).status).toBe('ok')

                await new Promise(resolve => setTimeout(resolve, 300))

                serverConn.publish(
                    buildOrganizationTopic(ORG_B, 'ticket'),
                    jc.encode({ org: ORG_B, id: 'secret-ticket', data: 'confidential' })
                )
                serverConn.publish(
                    buildOrganizationTopic(ORG_A, 'ticket'),
                    jc.encode({ org: ORG_A, id: 'own-ticket' })
                )
                await serverConn.flush()

                await new Promise(resolve => setTimeout(resolve, 1000))
                inboxSub.unsubscribe()
                await done

                expect(received).toHaveLength(1)
                expect(received[0].org).toBe(ORG_A)
                expect(received.find(m => m.org === ORG_B)).toBeUndefined()
            } finally {
                if (nc) await nc.close()
                await serverConn.close()
            }
        }, 15000)
    })

    describe('User revocation — relay state management', () => {
        it('revokeUser tears down relays tracked by this relay service', () => {
            // Directly test state management without depending on which relay
            // instance handles queue-group-distributed subscribe requests
            const mockSub = { unsubscribe: jest.fn() }
            const userId = 'revoke-unit-user'
            const relayId = 'relay-test-revoke'

            relayService.relays.set(relayId, {
                id: relayId,
                channel: 'organization',
                userId,
                deliverInbox: '_INBOX.test',
                actualTopic: 'organization.test-org.ticket',
                subscription: mockSub,
            })
            relayService.userRelays.set(userId, new Set([relayId]))

            const count = relayService.revokeUser(userId)

            expect(count).toBe(1)
            expect(relayService.relays.has(relayId)).toBe(false)
            expect(relayService.revokedUsers.has(userId)).toBe(true)
            expect(mockSub.unsubscribe).toHaveBeenCalledTimes(1)

            // Cleanup
            relayService.unrevokeUser(userId)
        })

        it('revokeUser adds to revokedUsers even with no active relays', () => {
            const userId = 'no-relays-user'
            const count = relayService.revokeUser(userId)

            expect(count).toBe(0)
            expect(relayService.revokedUsers.has(userId)).toBe(true)

            relayService.unrevokeUser(userId)
        })

        it('unrevokeUser removes from revokedUsers set', () => {
            const userId = 'unrevoke-user'
            relayService.revokeUser(userId)
            expect(relayService.revokedUsers.has(userId)).toBe(true)

            relayService.unrevokeUser(userId)
            expect(relayService.revokedUsers.has(userId)).toBe(false)
        })
    })

    describe('Revoked user relay rejection (end-to-end)', () => {
        const ORG_A = 'test-org-revoke-1111'

        it('revoked user gets error when creating new relay via this service', async () => {
            const USER_B = 'revoke-test-user-2'
            relayService.revokeUser(USER_B)

            let nc
            try {
                const token = createToken(ORG_A, USER_B)
                nc = await connectWithToken(token, 'revoke-new-relay')
                const jc = JSONCodec()

                // Try multiple times to ensure our relay instance handles it
                // (queue group distributes across instances)
                let gotRejected = false
                for (let attempt = 0; attempt < 5; attempt++) {
                    const deliverInbox = createInbox()
                    try {
                        const response = await nc.request(
                            `_MESSAGING.subscribe.user.${USER_B}.notification`,
                            jc.encode({ deliverInbox }),
                            { timeout: 3000 }
                        )
                        const data = jc.decode(response.data)
                        if (data.status === 'error' && data.reason === 'access revoked') {
                            gotRejected = true
                            break
                        }
                    } catch {
                        // timeout — another instance handled it, retry
                    }
                }
                expect(gotRejected).toBe(true)
            } finally {
                relayService.unrevokeUser(USER_B)
                if (nc) await nc.close()
            }
        })

        it('non-revoked user can still create relay subscriptions', async () => {
            const USER_C = 'non-revoked-user-1'

            let nc
            try {
                const token = createToken(ORG_A, USER_C)
                nc = await connectWithToken(token, 'non-revoked-relay')
                const jc = JSONCodec()

                const deliverInbox = createInbox()
                const response = await nc.request(
                    `_MESSAGING.subscribe.user.${USER_C}.notification`,
                    jc.encode({ deliverInbox }),
                    { timeout: 5000 }
                )
                const data = jc.decode(response.data)
                expect(data.status).toBe('ok')
                expect(data.relayId).toBeDefined()
            } finally {
                if (nc) await nc.close()
            }
        })
    })

    describe('Admin revoke/unrevoke topics — server-only access', () => {
        const ORG_A = 'test-org-admin-1111'

        it('regular client CANNOT publish to _MESSAGING.admin.revoke (PUB denied)', async () => {
            const token = createToken(ORG_A)
            const nc = await connectWithToken(token, 'admin-revoke-denied')
            try {
                await expect(nc.request(
                    '_MESSAGING.admin.revoke.some-user-id',
                    new TextEncoder().encode(''),
                    { timeout: 2000 }
                )).rejects.toThrow()
            } finally {
                await nc.close()
            }
        })

        it('regular client CANNOT publish to _MESSAGING.admin.unrevoke (PUB denied)', async () => {
            const token = createToken(ORG_A)
            const nc = await connectWithToken(token, 'admin-unrevoke-denied')
            try {
                await expect(nc.request(
                    '_MESSAGING.admin.unrevoke.some-user-id',
                    new TextEncoder().encode(''),
                    { timeout: 2000 }
                )).rejects.toThrow()
            } finally {
                await nc.close()
            }
        })

        it('server connection CAN publish to _MESSAGING.admin.revoke', async () => {
            const serverConn = await connect({
                servers: BROKER_URL,
                user: conf.MESSAGING_SERVER_USER,
                pass: conf.MESSAGING_SERVER_PASSWORD,
                name: 'admin-revoke-server',
            })
            try {
                // Server publishes fire-and-forget; no error = PUB allowed
                serverConn.publish('_MESSAGING.admin.revoke.test-admin-user')
                await serverConn.flush()
            } finally {
                await serverConn.close()
            }
        })

        it('server connection CAN publish to _MESSAGING.admin.unrevoke', async () => {
            const serverConn = await connect({
                servers: BROKER_URL,
                user: conf.MESSAGING_SERVER_USER,
                pass: conf.MESSAGING_SERVER_PASSWORD,
                name: 'admin-unrevoke-server',
            })
            try {
                serverConn.publish('_MESSAGING.admin.unrevoke.test-admin-user')
                await serverConn.flush()
            } finally {
                await serverConn.close()
            }
        })
    })

    describe('Token security edge cases', () => {
        it('rejects connection with forged token (wrong secret)', async () => {
            const forgedToken = jwt.sign(
                { userId: 'fake-user', organizationId: 'other-org' },
                // intentionally wrong secret to test that forged tokens are rejected
                // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret
                'wrong-secret',
                { expiresIn: '1h' }
            )
            await expect(connectWithToken(forgedToken, 'forged')).rejects.toThrow()
        })

        it('rejects connection with expired token', async () => {
            const expiredToken = jwt.sign(
                { userId: 'test-user', organizationId: 'org-1' },
                TOKEN_SECRET,
                { expiresIn: '0s' }
            )
            await new Promise(resolve => setTimeout(resolve, 100))
            let connectionFailed = false
            try {
                const nc = await connectWithToken(expiredToken, 'expired')
                await nc.close()
            } catch {
                connectionFailed = true
            }
            expect(connectionFailed).toBe(true)
        })

        it('rejects connection without organizationId', async () => {
            const token = jwt.sign(
                { userId: 'test-user' },
                TOKEN_SECRET,
                { expiresIn: '1h' }
            )
            let connectionFailed = false
            try {
                const nc = await connectWithToken(token, 'no-org')
                await nc.close()
            } catch {
                connectionFailed = true
            }
            expect(connectionFailed).toBe(true)
        })

        it('rejects connection with no token at all', async () => {
            let connectionFailed = false
            try {
                const nc = await connect({
                    servers: BROKER_URL,
                    name: 'no-token',
                    timeout: 5000,
                })
                await nc.close()
            } catch {
                connectionFailed = true
            }
            expect(connectionFailed).toBe(true)
        })
    })
})
