const { NatsAuthCalloutService, NatsSubscriptionRelay } = require('@open-condo/messaging/adapters/nats')


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
            relay.relayCounter = 0
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
            const relayEntry = {
                id: 'relay-1',
                channel: 'user',
                userId: 'user-1',
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

            relay.relays.set('relay-1', {
                id: 'relay-1', channel: 'user', userId: 'user-1',
                deliverInbox: '_INBOX.a', actualTopic: 'user.user-1.>',
                subscription: mockSub1,
            })
            relay.relays.set('relay-2', {
                id: 'relay-2', channel: 'organization', userId: 'user-1',
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

            relay.relays.set('relay-1', {
                id: 'relay-1', channel: 'user', userId: 'user-1',
                deliverInbox: '_INBOX.a', actualTopic: 'user.user-1.>',
                subscription: mockSub1,
            })
            relay.relays.set('relay-2', {
                id: 'relay-2', channel: 'user', userId: 'user-2',
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

    describe('NatsAdapter revocation delegation', () => {
        // Test that NatsAdapter.revokeUser delegates to both services
        const { NatsAdapter } = require('@open-condo/messaging/adapters/nats')

        it('revokeUser delegates to both authService and relayService', () => {
            const adapter = new NatsAdapter()

            // Set up mock services
            adapter.authService = new NatsAuthCalloutService()
            adapter.relayService = new NatsSubscriptionRelay()

            // Add a relay for the user
            const mockSub = { unsubscribe: jest.fn() }
            adapter.relayService.relays.set('relay-1', {
                id: 'relay-1', channel: 'user', userId: 'user-1',
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
    })
})
