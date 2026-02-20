const jwt = require('jsonwebtoken')
const { connect, JSONCodec, createInbox } = require('nats')
const nkeys = require('nkeys.js')

const conf = require('@open-condo/config')
const { NatsSubscriptionRelay } = require('@open-condo/messaging/adapters/nats')
const {
    decodeNatsJwt,
    createUserJwt,
    createAuthResponseJwt,
    computePermissions,
} = require('@open-condo/messaging/adapters/nats')

const TOKEN_SECRET = conf.MESSAGING_TOKEN_SECRET
const BROKER_URL = conf.MESSAGING_BROKER_URL

describe('NATS PUB-gated Relay Access Control Integration', () => {
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

                    const { allowedChannels, organizationId } = decoded
                    if (!allowedChannels || !organizationId || allowedChannels.length === 0) {
                        msg.respond(new TextEncoder().encode(createAuthResponseJwt({
                            userNkey: user_nkey, serverId, accountPublicKey,
                            error: 'Access denied', signingConfig: { keyPair: accountKeyPair },
                        })))
                        continue
                    }

                    const permissions = computePermissions(allowedChannels, organizationId)
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

    function createToken (organizationId, allowedChannels) {
        return jwt.sign(
            { userId: 'test-user', organizationId, allowedChannels },
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
            const token = createToken(ORG_A, ['ticket-changes'])
            const nc = await connectWithToken(token, 'connect-test')
            try {
                expect(nc).toBeDefined()
            } finally {
                await nc.close()
            }
        })

        it('can publish relay request for own org (PUB allowed)', async () => {
            const token = createToken(ORG_A, ['ticket-changes'])
            const nc = await connectWithToken(token, 'relay-own-org')
            const jc = JSONCodec()
            try {
                const deliverInbox = createInbox()
                const sub = nc.subscribe(deliverInbox)
                const response = await nc.request(
                    `_MESSAGING.subscribe.ticket-changes.${ORG_A}`,
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
            const token = createToken(ORG_A, ['ticket-changes'])
            const nc = await connectWithToken(token, 'relay-cross-org')
            const jc = JSONCodec()
            try {
                const deliverInbox = createInbox()
                await expect(nc.request(
                    `_MESSAGING.subscribe.ticket-changes.${ORG_B}`,
                    jc.encode({ deliverInbox }),
                    { timeout: 2000 }
                )).rejects.toThrow()
            } finally {
                await nc.close()
            }
        })

        it('CANNOT use JetStream API (no PUB permission)', async () => {
            const token = createToken(ORG_A, ['ticket-changes'])
            const nc = await connectWithToken(token, 'no-jetstream')
            try {
                const js = nc.jetstream()
                await expect(js.streams.get('ticket-changes')).rejects.toThrow()
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
                const token = createToken(ORG_A, ['ticket-changes'])
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
                    `_MESSAGING.subscribe.ticket-changes.${ORG_A}`,
                    jc.encode({ deliverInbox }),
                    { timeout: 5000 }
                )
                const relayData = jc.decode(response.data)
                expect(relayData.status).toBe('ok')

                await new Promise(resolve => setTimeout(resolve, 300))

                const serverJs = serverConn.jetstream()
                await serverJs.publish(
                    `ticket-changes.${ORG_A}.ticket-aaa`,
                    jc.encode({ org: ORG_A, id: 'ticket-aaa' })
                )
                await serverJs.publish(
                    `ticket-changes.${ORG_B}.ticket-bbb`,
                    jc.encode({ org: ORG_B, id: 'ticket-bbb' })
                )

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

        it('non-employee gets empty allowedChannels → connection rejected', async () => {
            const token = createToken(ORG_B, [])
            let connectionFailed = false
            try {
                const nc = await connectWithToken(token, 'non-employee')
                await nc.close()
            } catch {
                connectionFailed = true
            }
            expect(connectionFailed).toBe(true)
        })

        it('deleted user gets empty allowedChannels → connection rejected', async () => {
            const tokenPayload = {
                userId: 'deleted-user',
                organizationId: ORG_A,
                allowedChannels: [],
                deletedAt: '2024-01-01',
            }
            const token = jwt.sign(tokenPayload, TOKEN_SECRET, { expiresIn: '1h' })
            let connectionFailed = false
            try {
                const nc = await connectWithToken(token, 'deleted-user')
                await nc.close()
            } catch {
                connectionFailed = true
            }
            expect(connectionFailed).toBe(true)
        })

        it('user with org-A token cannot relay for org-B (PUB enforced)', async () => {
            const token = createToken(ORG_A, ['ticket-changes'])
            const nc = await connectWithToken(token, 'cross-org-denied')
            const jc = JSONCodec()
            try {
                await expect(nc.request(
                    `_MESSAGING.subscribe.ticket-changes.${ORG_B}`,
                    jc.encode({ deliverInbox: createInbox() }),
                    { timeout: 2000 }
                )).rejects.toThrow()
            } finally {
                await nc.close()
            }
        })

        it('user with org-A token cannot relay for stream not in allowedChannels', async () => {
            const token = createToken(ORG_A, ['ticket-changes'])
            const nc = await connectWithToken(token, 'wrong-stream-denied')
            const jc = JSONCodec()
            try {
                await expect(nc.request(
                    `_MESSAGING.subscribe.contact-changes.${ORG_A}`,
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
                const token = createToken(ORG_A, ['ticket-changes'])
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
                    `_MESSAGING.subscribe.ticket-changes.${ORG_A}`,
                    jc.encode({ deliverInbox }),
                    { timeout: 5000 }
                )
                expect(jc.decode(response.data).status).toBe('ok')

                await new Promise(resolve => setTimeout(resolve, 300))

                const serverJs = serverConn.jetstream()
                await serverJs.publish(
                    `ticket-changes.${ORG_B}.secret-ticket`,
                    jc.encode({ org: ORG_B, id: 'secret-ticket', data: 'confidential' })
                )
                await serverJs.publish(
                    `ticket-changes.${ORG_A}.own-ticket`,
                    jc.encode({ org: ORG_A, id: 'own-ticket' })
                )

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

    describe('Token security edge cases', () => {
        it('rejects connection with forged token (wrong secret)', async () => {
            const forgedToken = jwt.sign(
                { userId: 'fake-user', organizationId: 'other-org', allowedChannels: ['ticket-changes'] },
                // intentionally wrong secret to test that forged tokens are rejected
                // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret
                'wrong-secret',
                { expiresIn: '1h' }
            )
            await expect(connectWithToken(forgedToken, 'forged')).rejects.toThrow()
        })

        it('rejects connection with expired token', async () => {
            const expiredToken = jwt.sign(
                { userId: 'test-user', organizationId: 'org-1', allowedChannels: ['ticket-changes'] },
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
                { userId: 'test-user', allowedChannels: ['ticket-changes'] },
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

        it('rejects connection without allowedChannels', async () => {
            const token = jwt.sign(
                { userId: 'test-user', organizationId: 'org-1' },
                TOKEN_SECRET,
                { expiresIn: '1h' }
            )
            let connectionFailed = false
            try {
                const nc = await connectWithToken(token, 'no-streams')
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

        it('rejects connection with empty allowedChannels', async () => {
            const token = createToken('some-org', [])
            let connectionFailed = false
            try {
                const nc = await connectWithToken(token, 'empty-streams')
                await nc.close()
            } catch {
                connectionFailed = true
            }
            expect(connectionFailed).toBe(true)
        })
    })
})
