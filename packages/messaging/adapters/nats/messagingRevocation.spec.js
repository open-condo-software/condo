const { APP_PREFIX } = require('../../core/topic')

const { NatsAuthCalloutService, NatsSubscriptionRelay } = require('./index')



describe('Messaging Revocation — unit tests', () => {
    describe('NatsAuthCalloutService revocation', () => {
        let service

        beforeEach(() => {
            service = new NatsAuthCalloutService()
        })

        it('revokeUser adds userId to revokedUsers set', () => {
            service.revokeUser('user-1')
            expect(service.revokedUsers.has('user-1')).toBe(true)
        })

        it('unrevokeUser removes userId from revokedUsers set', () => {
            service.revokeUser('user-1')
            expect(service.revokedUsers.has('user-1')).toBe(true)
            service.unrevokeUser('user-1')
            expect(service.revokedUsers.has('user-1')).toBe(false)
        })

        it('revoking the same user twice is idempotent', () => {
            service.revokeUser('user-1')
            service.revokeUser('user-1')
            expect(service.revokedUsers.size).toBe(1)
        })

        it('unrevoking a non-revoked user is a no-op', () => {
            service.unrevokeUser('user-1')
            expect(service.revokedUsers.has('user-1')).toBe(false)
        })

        it('revocation is user-scoped (other users unaffected)', () => {
            service.revokeUser('user-1')
            expect(service.revokedUsers.has('user-1')).toBe(true)
            expect(service.revokedUsers.has('user-2')).toBe(false)
        })
    })

    describe('NatsSubscriptionRelay revocation', () => {
        let relay

        beforeEach(() => {
            relay = new NatsSubscriptionRelay()
            // Simulate initialized state without a real NATS connection
        })

        it('revokeUser adds userId to revokedUsers set', () => {
            relay.revokeUser('user-1')
            expect(relay.revokedUsers.has('user-1')).toBe(true)
        })

        it('unrevokeUser removes userId from revokedUsers set', () => {
            relay.revokeUser('user-1')
            relay.unrevokeUser('user-1')
            expect(relay.revokedUsers.has('user-1')).toBe(false)
        })

        it('revokeUser tears down existing relays for that user', () => {
            const mockSub = { unsubscribe: jest.fn() }
            relay.connection = { publish: jest.fn() }
            const relayEntry = {
                id: 'relay-1',
                requestingUserId: 'user-1',
                deliverInbox: '_INBOX.test',
                actualTopic: 'user.user-1.>',
                subscription: mockSub,
            }
            relay.relays.set('relay-1', relayEntry)
            relay.userRelays.set('user-1', new Set(['relay-1']))

            const count = relay.revokeUser('user-1')

            expect(count).toBe(1)
            expect(relay.relays.size).toBe(0)
            expect(relay.userRelays.has('user-1')).toBe(false)
            expect(mockSub.unsubscribe).toHaveBeenCalledTimes(1)
        })

        it('revokeUser tears down multiple relays for the same user', () => {
            const mockSub1 = { unsubscribe: jest.fn() }
            const mockSub2 = { unsubscribe: jest.fn() }
            relay.connection = { publish: jest.fn() }

            relay.relays.set('relay-1', {
                id: 'relay-1', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.a', actualTopic: 'user.user-1.>',
                subscription: mockSub1,
            })
            relay.relays.set('relay-2', {
                id: 'relay-2', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.b', actualTopic: 'organization.org-1.ticket',
                subscription: mockSub2,
            })
            relay.userRelays.set('user-1', new Set(['relay-1', 'relay-2']))

            const count = relay.revokeUser('user-1')

            expect(count).toBe(2)
            expect(relay.relays.size).toBe(0)
            expect(mockSub1.unsubscribe).toHaveBeenCalledTimes(1)
            expect(mockSub2.unsubscribe).toHaveBeenCalledTimes(1)
        })

        it('revokeUser does NOT affect other users relays', () => {
            const mockSub1 = { unsubscribe: jest.fn() }
            const mockSub2 = { unsubscribe: jest.fn() }
            relay.connection = { publish: jest.fn() }

            relay.relays.set('relay-1', {
                id: 'relay-1', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.a', actualTopic: 'user.user-1.>',
                subscription: mockSub1,
            })
            relay.relays.set('relay-2', {
                id: 'relay-2', requestingUserId: 'user-2',
                deliverInbox: '_INBOX.b', actualTopic: 'user.user-2.>',
                subscription: mockSub2,
            })
            relay.userRelays.set('user-1', new Set(['relay-1']))
            relay.userRelays.set('user-2', new Set(['relay-2']))

            relay.revokeUser('user-1')

            expect(relay.relays.size).toBe(1)
            expect(relay.relays.has('relay-2')).toBe(true)
            expect(mockSub1.unsubscribe).toHaveBeenCalledTimes(1)
            expect(mockSub2.unsubscribe).not.toHaveBeenCalled()
        })

        it('revokeUser returns 0 for user with no relays', () => {
            const count = relay.revokeUser('nonexistent-user')
            expect(count).toBe(0)
            expect(relay.revokedUsers.has('nonexistent-user')).toBe(true)
        })

        it('unrevokeUser allows the user to be re-admitted', () => {
            relay.revokeUser('user-1')
            expect(relay.revokedUsers.has('user-1')).toBe(true)
            relay.unrevokeUser('user-1')
            expect(relay.revokedUsers.has('user-1')).toBe(false)
        })

        it('_cleanupAll clears revokedUsers along with relays', () => {
            relay.revokeUser('user-1')
            relay.revokeUser('user-2')
            relay._cleanupAll()
            expect(relay.revokedUsers.size).toBe(0)
            expect(relay.relays.size).toBe(0)
            expect(relay.userRelays.size).toBe(0)
        })
    })

    describe('NatsSubscriptionRelay TTL-based cleanup', () => {
        let relay

        beforeEach(() => {
            relay = new NatsSubscriptionRelay()
            relay.relayTtlMs = 1000
        })

        it('_sweepExpiredRelays removes relays older than TTL', () => {
            const mockSub = { unsubscribe: jest.fn() }
            relay.connection = { publish: jest.fn() }
            relay.relays.set('relay-1', {
                id: 'relay-1', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.a', actualTopic: 'user.user-1.>',
                subscription: mockSub,
                createdAt: Date.now() - 2000,
            })
            relay.userRelays.set('user-1', new Set(['relay-1']))

            relay._sweepExpiredRelays()

            expect(relay.relays.size).toBe(0)
            expect(relay.userRelays.has('user-1')).toBe(false)
            expect(mockSub.unsubscribe).toHaveBeenCalledTimes(1)
        })

        it('_sweepExpiredRelays keeps relays within TTL', () => {
            const mockSub = { unsubscribe: jest.fn() }
            relay.relays.set('relay-1', {
                id: 'relay-1', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.a', actualTopic: 'user.user-1.>',
                subscription: mockSub,
                createdAt: Date.now(),
            })
            relay.userRelays.set('user-1', new Set(['relay-1']))

            relay._sweepExpiredRelays()

            expect(relay.relays.size).toBe(1)
            expect(mockSub.unsubscribe).not.toHaveBeenCalled()
        })

        it('_sweepExpiredRelays removes only expired relays in mixed set', () => {
            const mockSub1 = { unsubscribe: jest.fn() }
            const mockSub2 = { unsubscribe: jest.fn() }
            relay.connection = { publish: jest.fn() }

            relay.relays.set('relay-1', {
                id: 'relay-1', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.a', actualTopic: 'user.user-1.>',
                subscription: mockSub1,
                createdAt: Date.now() - 2000,
            })
            relay.relays.set('relay-2', {
                id: 'relay-2', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.b', actualTopic: 'user.user-1.>',
                subscription: mockSub2,
                createdAt: Date.now(),
            })
            relay.userRelays.set('user-1', new Set(['relay-1', 'relay-2']))

            relay._sweepExpiredRelays()

            expect(relay.relays.size).toBe(1)
            expect(relay.relays.has('relay-2')).toBe(true)
            expect(mockSub1.unsubscribe).toHaveBeenCalledTimes(1)
            expect(mockSub2.unsubscribe).not.toHaveBeenCalled()
        })

        it('_cleanupAll stops the cleanup timer', () => {
            relay._cleanupTimer = setInterval(() => {}, 60000)
            relay._cleanupAll()
            expect(relay._cleanupTimer).toBeNull()
        })

        it('new relays include createdAt timestamp', () => {
            const before = Date.now()
            const relayEntry = {
                id: 'relay-1', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.a', actualTopic: 'user.user-1.>',
                subscription: { unsubscribe: jest.fn() },
                createdAt: Date.now(),
            }
            relay.relays.set('relay-1', relayEntry)

            expect(relayEntry.createdAt).toBeGreaterThanOrEqual(before)
            expect(relayEntry.createdAt).toBeLessThanOrEqual(Date.now())
        })
    })

    describe('NatsSubscriptionRelay unsubscribe ownership', () => {
        let relay

        beforeEach(() => {
            relay = new NatsSubscriptionRelay()
        })

        it('_handleUnsubscribeRequest rejects when requestingUserId does not match', () => {
            const mockSub = { unsubscribe: jest.fn() }
            relay.relays.set('relay-1', {
                id: 'relay-1',
                requestingUserId: 'user-A',
                deliverInbox: '_INBOX.a', actualTopic: 'organization.org-1.>',
                subscription: mockSub, createdAt: Date.now(),
            })

            relay._handleUnsubscribeRequest({ subject: '_MESSAGING.unsubscribe.user-B.relay-1' })

            expect(relay.relays.has('relay-1')).toBe(true)
            expect(mockSub.unsubscribe).not.toHaveBeenCalled()
        })

        it('_handleUnsubscribeRequest allows when requestingUserId matches', () => {
            const mockSub = { unsubscribe: jest.fn() }
            relay.relays.set('relay-1', {
                id: 'relay-1',
                requestingUserId: 'user-A',
                deliverInbox: '_INBOX.a', actualTopic: 'organization.org-1.>',
                subscription: mockSub, createdAt: Date.now(),
            })

            relay._handleUnsubscribeRequest({ subject: '_MESSAGING.unsubscribe.user-A.relay-1' })

            expect(relay.relays.has('relay-1')).toBe(false)
            expect(mockSub.unsubscribe).toHaveBeenCalledTimes(1)
        })

        it('_handleUnsubscribeRequest rejects 3-segment topic (missing userId)', () => {
            const mockSub = { unsubscribe: jest.fn() }
            relay.relays.set('relay-1', {
                id: 'relay-1',
                requestingUserId: 'user-1',
                deliverInbox: '_INBOX.a', actualTopic: 'user.user-1.>',
                subscription: mockSub, createdAt: Date.now(),
            })

            relay._handleUnsubscribeRequest({ subject: '_MESSAGING.unsubscribe.relay-1' })

            expect(relay.relays.has('relay-1')).toBe(true)
            expect(mockSub.unsubscribe).not.toHaveBeenCalled()
        })

        it('revokeUser tears down org relays tracked by requestingUserId', () => {
            const mockSub = { unsubscribe: jest.fn() }
            const relayEntry = {
                id: 'relay-1',
                requestingUserId: 'user-A',
                deliverInbox: '_INBOX.a', actualTopic: 'organization.org-1.>',
                subscription: mockSub, createdAt: Date.now(),
            }
            relay.relays.set('relay-1', relayEntry)
            relay.userRelays.set('user-A', new Set(['relay-1']))

            relay.revokeUser('user-A')

            expect(relay.relays.size).toBe(0)
            expect(relay.userRelays.has('user-A')).toBe(false)
            expect(mockSub.unsubscribe).toHaveBeenCalledTimes(1)
        })

        it('revokeUser tears down mixed user + org relays for the same requestingUserId', () => {
            const mockSub1 = { unsubscribe: jest.fn() }
            const mockSub2 = { unsubscribe: jest.fn() }

            relay.relays.set('relay-1', {
                id: 'relay-1',
                requestingUserId: 'user-A',
                deliverInbox: '_INBOX.a', actualTopic: 'user.user-A.>',
                subscription: mockSub1, createdAt: Date.now(),
            })
            relay.relays.set('relay-2', {
                id: 'relay-2',
                requestingUserId: 'user-A',
                deliverInbox: '_INBOX.b', actualTopic: 'organization.org-1.>',
                subscription: mockSub2, createdAt: Date.now(),
            })
            relay.userRelays.set('user-A', new Set(['relay-1', 'relay-2']))

            const count = relay.revokeUser('user-A')

            expect(count).toBe(2)
            expect(relay.relays.size).toBe(0)
            expect(mockSub1.unsubscribe).toHaveBeenCalledTimes(1)
            expect(mockSub2.unsubscribe).toHaveBeenCalledTimes(1)
        })
    })

    describe('NatsSubscriptionRelay per-user relay limit', () => {
        let relay

        beforeEach(() => {
            relay = new NatsSubscriptionRelay()
            relay.maxRelaysPerUser = 3
        })

        it('rejects relay request when user has reached maxRelaysPerUser', async () => {
            relay.userRelays.set('user-1', new Set(['r-1', 'r-2', 'r-3']))

            const replyData = []
            const mockMsg = {
                subject: `_MESSAGING.subscribe.user-1.${APP_PREFIX}.organization.org-1.ticket`,
                data: relay.jc.encode({ deliverInbox: '_INBOX.test' }),
                reply: 'reply-subject',
            }
            relay.connection = {
                publish: jest.fn((subject, data) => {
                    if (subject === 'reply-subject') replyData.push(relay.jc.decode(data))
                }),
            }

            await relay._handleSubscribeRequest(mockMsg)

            expect(replyData).toHaveLength(1)
            expect(replyData[0].status).toBe('error')
            expect(replyData[0].reason).toBe('relay limit reached')
        })

        it('allows relay request when user is below maxRelaysPerUser', async () => {
            relay.userRelays.set('user-1', new Set(['r-1', 'r-2']))

            const mockSub = { [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}) }), unsubscribe: jest.fn() }
            relay.connection = { publish: jest.fn() }
            relay.js = { subscribe: jest.fn().mockResolvedValue(mockSub) }

            await relay._handleSubscribeRequest({
                subject: `_MESSAGING.subscribe.user-1.${APP_PREFIX}.organization.org-1.ticket`,
                data: relay.jc.encode({ deliverInbox: '_INBOX.test' }),
                reply: 'reply-subject',
            })

            expect(relay.js.subscribe).toHaveBeenCalledWith(`${APP_PREFIX}.organization.org-1.ticket`, expect.anything())
        })
    })

    describe('NatsSubscriptionRelay crypto-random relay IDs', () => {
        let relay

        beforeEach(() => {
            relay = new NatsSubscriptionRelay()
            relay.maxRelaysPerUser = 50
        })

        it('generates relay IDs with crypto-random hex suffix', async () => {
            const mockSub = { [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}) }), unsubscribe: jest.fn() }
            const publishedReplies = []
            relay.connection = {
                publish: jest.fn((subject, data) => {
                    if (data) publishedReplies.push(relay.jc.decode(data))
                }),
            }
            relay.js = { subscribe: jest.fn().mockResolvedValue(mockSub) }

            await relay._handleSubscribeRequest({
                subject: `_MESSAGING.subscribe.user-1.${APP_PREFIX}.user.user-1.notification`,
                data: relay.jc.encode({ deliverInbox: '_INBOX.test' }),
                reply: 'reply-subject',
            })

            expect(publishedReplies).toHaveLength(1)
            const { relayId } = publishedReplies[0]
            expect(relayId).toMatch(/^relay-[0-9a-f]{24}$/)
        })

        it('generates unique relay IDs across multiple requests', async () => {
            const mockSub = { [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}) }), unsubscribe: jest.fn() }
            const relayIds = []
            relay.connection = {
                publish: jest.fn((subject, data) => {
                    if (data) {
                        const decoded = relay.jc.decode(data)
                        if (decoded.relayId) relayIds.push(decoded.relayId)
                    }
                }),
            }
            relay.js = { subscribe: jest.fn().mockResolvedValue(mockSub) }

            for (let i = 0; i < 5; i++) {
                await relay._handleSubscribeRequest({
                    subject: `_MESSAGING.subscribe.user-1.${APP_PREFIX}.user.user-1.notification`,
                    data: relay.jc.encode({ deliverInbox: `_INBOX.test-${i}` }),
                    reply: `reply-${i}`,
                })
            }

            expect(new Set(relayIds).size).toBe(5)
        })
    })

    describe('NatsSubscriptionRelay topic format validation', () => {
        let relay

        beforeEach(() => {
            relay = new NatsSubscriptionRelay()
            relay.maxRelaysPerUser = 50
        })

        it('rejects topic that does not start with APP_PREFIX', async () => {
            const replyData = []
            relay.connection = {
                publish: jest.fn((subject, data) => {
                    if (data) replyData.push(relay.jc.decode(data))
                }),
            }

            await relay._handleSubscribeRequest({
                subject: '_MESSAGING.subscribe.user-1.evil_prefix.organization.org-1.ticket',
                data: relay.jc.encode({ deliverInbox: '_INBOX.test' }),
                reply: 'reply-subject',
            })

            expect(replyData).toHaveLength(1)
            expect(replyData[0].status).toBe('error')
            expect(replyData[0].reason).toBe('invalid topic')
        })

        it('accepts topic that starts with APP_PREFIX', async () => {
            const mockSub = { [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}) }), unsubscribe: jest.fn() }
            relay.connection = { publish: jest.fn() }
            relay.js = { subscribe: jest.fn().mockResolvedValue(mockSub) }

            await relay._handleSubscribeRequest({
                subject: `_MESSAGING.subscribe.user-1.${APP_PREFIX}.organization.org-1.ticket`,
                data: relay.jc.encode({ deliverInbox: '_INBOX.test' }),
                reply: 'reply-subject',
            })

            expect(relay.js.subscribe).toHaveBeenCalledWith(`${APP_PREFIX}.organization.org-1.ticket`, expect.anything())
        })
    })

    describe('NatsAuthCalloutService organization revocation', () => {
        let service

        beforeEach(() => {
            service = new NatsAuthCalloutService()
        })

        it('revokeUserOrganization adds userId-orgId pair to revokedUserOrgs', () => {
            service.revokeUserOrganization('user-1', 'org-1')
            expect(service.revokedUserOrgs.get('user-1').has('org-1')).toBe(true)
        })

        it('unrevokeUserOrganization removes userId-orgId pair', () => {
            service.revokeUserOrganization('user-1', 'org-1')
            service.unrevokeUserOrganization('user-1', 'org-1')
            expect(service.revokedUserOrgs.has('user-1')).toBe(false)
        })

        it('revoking multiple orgs for the same user tracks them separately', () => {
            service.revokeUserOrganization('user-1', 'org-1')
            service.revokeUserOrganization('user-1', 'org-2')
            expect(service.revokedUserOrgs.get('user-1').size).toBe(2)
            expect(service.revokedUserOrgs.get('user-1').has('org-1')).toBe(true)
            expect(service.revokedUserOrgs.get('user-1').has('org-2')).toBe(true)
        })

        it('unrevoking one org does not affect other revoked orgs for same user', () => {
            service.revokeUserOrganization('user-1', 'org-1')
            service.revokeUserOrganization('user-1', 'org-2')
            service.unrevokeUserOrganization('user-1', 'org-1')
            expect(service.revokedUserOrgs.get('user-1').has('org-1')).toBe(false)
            expect(service.revokedUserOrgs.get('user-1').has('org-2')).toBe(true)
        })

        it('unrevoking a non-revoked org is a no-op', () => {
            service.unrevokeUserOrganization('user-1', 'org-1')
            expect(service.revokedUserOrgs.has('user-1')).toBe(false)
        })

        it('org revocation is user-scoped (other users unaffected)', () => {
            service.revokeUserOrganization('user-1', 'org-1')
            expect(service.revokedUserOrgs.has('user-2')).toBe(false)
        })
    })

    describe('NatsSubscriptionRelay organization revocation', () => {
        let relay

        beforeEach(() => {
            relay = new NatsSubscriptionRelay()
            relay.maxRelaysPerUser = 50
        })

        it('revokeUserOrganization tears down only org-scoped relays', () => {
            const mockSubOrg = { unsubscribe: jest.fn() }
            const mockSubUser = { unsubscribe: jest.fn() }
            relay.connection = { publish: jest.fn() }

            relay.relays.set('relay-org', {
                id: 'relay-org', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.a', actualTopic: `${APP_PREFIX}.organization.org-1.ticket`,
                subscription: mockSubOrg,
            })
            relay.relays.set('relay-user', {
                id: 'relay-user', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.b', actualTopic: `${APP_PREFIX}.user.user-1.notification`,
                subscription: mockSubUser,
            })
            relay.userRelays.set('user-1', new Set(['relay-org', 'relay-user']))

            const count = relay.revokeUserOrganization('user-1', 'org-1')

            expect(count).toBe(1)
            expect(relay.relays.has('relay-org')).toBe(false)
            expect(relay.relays.has('relay-user')).toBe(true)
            expect(mockSubOrg.unsubscribe).toHaveBeenCalledTimes(1)
            expect(mockSubUser.unsubscribe).not.toHaveBeenCalled()
        })

        it('revokeUserOrganization does NOT affect other orgs', () => {
            const mockSub1 = { unsubscribe: jest.fn() }
            const mockSub2 = { unsubscribe: jest.fn() }
            relay.connection = { publish: jest.fn() }

            relay.relays.set('relay-1', {
                id: 'relay-1', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.a', actualTopic: `${APP_PREFIX}.organization.org-1.ticket`,
                subscription: mockSub1,
            })
            relay.relays.set('relay-2', {
                id: 'relay-2', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.b', actualTopic: `${APP_PREFIX}.organization.org-2.ticket`,
                subscription: mockSub2,
            })
            relay.userRelays.set('user-1', new Set(['relay-1', 'relay-2']))

            relay.revokeUserOrganization('user-1', 'org-1')

            expect(relay.relays.has('relay-1')).toBe(false)
            expect(relay.relays.has('relay-2')).toBe(true)
            expect(mockSub1.unsubscribe).toHaveBeenCalledTimes(1)
            expect(mockSub2.unsubscribe).not.toHaveBeenCalled()
        })

        it('revokeUserOrganization returns 0 for user with no relays', () => {
            const count = relay.revokeUserOrganization('user-1', 'org-1')
            expect(count).toBe(0)
            expect(relay.revokedUserOrgs.get('user-1').has('org-1')).toBe(true)
        })

        it('unrevokeUserOrganization removes the org from revokedUserOrgs', () => {
            relay.revokeUserOrganization('user-1', 'org-1')
            expect(relay.revokedUserOrgs.get('user-1').has('org-1')).toBe(true)
            relay.unrevokeUserOrganization('user-1', 'org-1')
            expect(relay.revokedUserOrgs.has('user-1')).toBe(false)
        })

        it('rejects new relay request for revoked user-organization', async () => {
            relay.revokeUserOrganization('user-1', 'org-1')

            const replyData = []
            relay.connection = {
                publish: jest.fn((subject, data) => {
                    if (data) replyData.push(relay.jc.decode(data))
                }),
            }

            await relay._handleSubscribeRequest({
                subject: `_MESSAGING.subscribe.user-1.${APP_PREFIX}.organization.org-1.ticket`,
                data: relay.jc.encode({ deliverInbox: '_INBOX.test' }),
                reply: 'reply-subject',
            })

            expect(replyData).toHaveLength(1)
            expect(replyData[0].status).toBe('error')
            expect(replyData[0].reason).toBe('organization access revoked')
        })

        it('allows relay request for non-revoked org after revoking another org', async () => {
            relay.revokeUserOrganization('user-1', 'org-1')

            const mockSub = { [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}) }), unsubscribe: jest.fn() }
            relay.connection = { publish: jest.fn() }
            relay.js = { subscribe: jest.fn().mockResolvedValue(mockSub) }

            await relay._handleSubscribeRequest({
                subject: `_MESSAGING.subscribe.user-1.${APP_PREFIX}.organization.org-2.ticket`,
                data: relay.jc.encode({ deliverInbox: '_INBOX.test' }),
                reply: 'reply-subject',
            })

            expect(relay.js.subscribe).toHaveBeenCalledWith(`${APP_PREFIX}.organization.org-2.ticket`, expect.anything())
        })

        it('allows user-channel relay request when org is revoked', async () => {
            relay.revokeUserOrganization('user-1', 'org-1')

            const mockSub = { [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}) }), unsubscribe: jest.fn() }
            relay.connection = { publish: jest.fn() }
            relay.js = { subscribe: jest.fn().mockResolvedValue(mockSub) }

            await relay._handleSubscribeRequest({
                subject: `_MESSAGING.subscribe.user-1.${APP_PREFIX}.user.user-1.notification`,
                data: relay.jc.encode({ deliverInbox: '_INBOX.test' }),
                reply: 'reply-subject',
            })

            expect(relay.js.subscribe).toHaveBeenCalledWith(`${APP_PREFIX}.user.user-1.notification`, expect.anything())
        })

        it('_cleanupAll clears revokedUserOrgs', () => {
            relay.revokeUserOrganization('user-1', 'org-1')
            relay.revokeUserOrganization('user-2', 'org-2')
            relay._cleanupAll()
            expect(relay.revokedUserOrgs.size).toBe(0)
        })
    })

    describe('NatsAdapter revocation delegation', () => {
        // Test that NatsAdapter.revokeUser delegates to both services
        const { NatsAdapter } = require('./index')

        it('revokeUser delegates to both authService and relayService', () => {
            const adapter = new NatsAdapter()

            // Set up mock services
            adapter.authService = new NatsAuthCalloutService()
            adapter.relayService = new NatsSubscriptionRelay()
            adapter.relayService.connection = { publish: jest.fn() }

            // Add a relay for the user
            const mockSub = { unsubscribe: jest.fn() }
            adapter.relayService.relays.set('relay-1', {
                id: 'relay-1', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.a', actualTopic: 'user.user-1.>',
                subscription: mockSub,
            })
            adapter.relayService.userRelays.set('user-1', new Set(['relay-1']))

            const count = adapter.revokeUser('user-1')

            expect(count).toBe(1)
            expect(adapter.authService.revokedUsers.has('user-1')).toBe(true)
            expect(adapter.relayService.revokedUsers.has('user-1')).toBe(true)
            expect(adapter.relayService.relays.size).toBe(0)
        })

        it('unrevokeUser delegates to both services', () => {
            const adapter = new NatsAdapter()
            adapter.authService = new NatsAuthCalloutService()
            adapter.relayService = new NatsSubscriptionRelay()

            adapter.revokeUser('user-1')
            expect(adapter.authService.revokedUsers.has('user-1')).toBe(true)
            expect(adapter.relayService.revokedUsers.has('user-1')).toBe(true)

            adapter.unrevokeUser('user-1')
            expect(adapter.authService.revokedUsers.has('user-1')).toBe(false)
            expect(adapter.relayService.revokedUsers.has('user-1')).toBe(false)
        })

        it('revokeUser works when services are not initialized', () => {
            const adapter = new NatsAdapter()
            expect(() => adapter.revokeUser('user-1')).not.toThrow()
            expect(adapter.revokeUser('user-1')).toBe(0)
        })

        it('revokeUserOrganization delegates to both authService and relayService', () => {
            const adapter = new NatsAdapter()
            adapter.authService = new NatsAuthCalloutService()
            adapter.relayService = new NatsSubscriptionRelay()
            adapter.relayService.connection = { publish: jest.fn() }

            const mockSub = { unsubscribe: jest.fn() }
            adapter.relayService.relays.set('relay-1', {
                id: 'relay-1', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.a', actualTopic: `${APP_PREFIX}.organization.org-1.ticket`,
                subscription: mockSub,
            })
            adapter.relayService.userRelays.set('user-1', new Set(['relay-1']))

            const count = adapter.revokeUserOrganization('user-1', 'org-1')

            expect(count).toBe(1)
            expect(adapter.authService.revokedUserOrgs.get('user-1').has('org-1')).toBe(true)
            expect(adapter.relayService.revokedUserOrgs.get('user-1').has('org-1')).toBe(true)
            expect(adapter.relayService.relays.size).toBe(0)
        })

        it('unrevokeUserOrganization delegates to both services', () => {
            const adapter = new NatsAdapter()
            adapter.authService = new NatsAuthCalloutService()
            adapter.relayService = new NatsSubscriptionRelay()

            adapter.revokeUserOrganization('user-1', 'org-1')
            expect(adapter.authService.revokedUserOrgs.get('user-1').has('org-1')).toBe(true)
            expect(adapter.relayService.revokedUserOrgs.get('user-1').has('org-1')).toBe(true)

            adapter.unrevokeUserOrganization('user-1', 'org-1')
            expect(adapter.authService.revokedUserOrgs.has('user-1')).toBe(false)
            expect(adapter.relayService.revokedUserOrgs.has('user-1')).toBe(false)
        })

        it('revokeUserOrganization works when services are not initialized', () => {
            const adapter = new NatsAdapter()
            expect(() => adapter.revokeUserOrganization('user-1', 'org-1')).not.toThrow()
            expect(adapter.revokeUserOrganization('user-1', 'org-1')).toBe(0)
        })
    })

    describe('Sentinel notifications on relay teardown', () => {
        let relay

        beforeEach(() => {
            relay = new NatsSubscriptionRelay()
            relay.relayTtlMs = 1000
            relay.connection = { publish: jest.fn() }
        })

        it('revokeUser sends __relay_closed sentinel to each relay deliverInbox', () => {
            const mockSub = { unsubscribe: jest.fn() }
            relay.relays.set('relay-1', {
                id: 'relay-1', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.test', actualTopic: 'user.user-1.>',
                subscription: mockSub,
            })
            relay.userRelays.set('user-1', new Set(['relay-1']))

            relay.revokeUser('user-1')

            const sentinelCall = relay.connection.publish.mock.calls.find(
                ([subject]) => subject === '_INBOX.test'
            )
            expect(sentinelCall).toBeDefined()
            const decoded = relay.jc.decode(sentinelCall[1])
            expect(decoded.__relay_closed).toBe(true)
            expect(decoded.relayId).toBe('relay-1')
            expect(decoded.reason).toBe('access revoked')
        })

        it('_sweepExpiredRelays sends __relay_closed sentinel with reason expired', () => {
            const mockSub = { unsubscribe: jest.fn() }
            relay.relays.set('relay-1', {
                id: 'relay-1', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.sweep', actualTopic: 'user.user-1.>',
                subscription: mockSub,
                createdAt: Date.now() - 2000,
            })
            relay.userRelays.set('user-1', new Set(['relay-1']))

            relay._sweepExpiredRelays()

            const sentinelCall = relay.connection.publish.mock.calls.find(
                ([subject]) => subject === '_INBOX.sweep'
            )
            expect(sentinelCall).toBeDefined()
            const decoded = relay.jc.decode(sentinelCall[1])
            expect(decoded.__relay_closed).toBe(true)
            expect(decoded.reason).toBe('expired')
        })

        it('revokeUserOrganization sends __relay_closed sentinel with org reason', () => {
            relay.maxRelaysPerUser = 50
            const mockSub = { unsubscribe: jest.fn() }
            relay.relays.set('relay-1', {
                id: 'relay-1', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.org', actualTopic: `${APP_PREFIX}.organization.org-1.ticket`,
                subscription: mockSub,
            })
            relay.userRelays.set('user-1', new Set(['relay-1']))

            relay.revokeUserOrganization('user-1', 'org-1')

            const sentinelCall = relay.connection.publish.mock.calls.find(
                ([subject]) => subject === '_INBOX.org'
            )
            expect(sentinelCall).toBeDefined()
            const decoded = relay.jc.decode(sentinelCall[1])
            expect(decoded.__relay_closed).toBe(true)
            expect(decoded.reason).toBe('organization access revoked')
        })

        it('explicit _handleUnsubscribeRequest does NOT send sentinel (client-initiated)', () => {
            const mockSub = { unsubscribe: jest.fn() }
            relay.relays.set('relay-1', {
                id: 'relay-1', requestingUserId: 'user-1',
                deliverInbox: '_INBOX.unsub', actualTopic: 'user.user-1.>',
                subscription: mockSub,
            })
            relay.userRelays.set('user-1', new Set(['relay-1']))

            relay._handleUnsubscribeRequest({
                subject: '_MESSAGING.unsubscribe.user-1.relay-1',
                reply: 'reply-subject',
            })

            const sentinelCall = relay.connection.publish.mock.calls.find(
                ([subject]) => subject === '_INBOX.unsub'
            )
            expect(sentinelCall).toBeUndefined()
            expect(relay.relays.size).toBe(0)
        })
    })
})
