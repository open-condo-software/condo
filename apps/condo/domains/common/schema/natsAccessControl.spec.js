const jwt = require('jsonwebtoken')
const nkeys = require('nkeys.js')

const conf = require('@open-condo/config')
const { computePermissions, createUserJwt, decodeNatsJwt } = require('@open-condo/messaging/adapters/nats')
const { matchTopic, isTopicAllowed } = require('@open-condo/messaging/utils')

const TOKEN_SECRET = conf.MESSAGING_TOKEN_SECRET

describe('NATS Access Control', () => {
    describe('Topic matching utility', () => {
        it('matches exact topics', () => {
            expect(matchTopic('foo.bar', 'foo.bar')).toBe(true)
            expect(matchTopic('foo.bar', 'foo.baz')).toBe(false)
        })

        it('matches single-token wildcard (*)', () => {
            expect(matchTopic('foo.bar', 'foo.*')).toBe(true)
            expect(matchTopic('foo.bar.baz', 'foo.*')).toBe(false)
        })

        it('matches multi-token wildcard (>)', () => {
            expect(matchTopic('foo.bar', 'foo.>')).toBe(true)
            expect(matchTopic('foo.bar.baz', 'foo.>')).toBe(true)
            expect(matchTopic('foo', 'foo.>')).toBe(false)
        })

        it('matches full wildcard', () => {
            expect(matchTopic('foo', '>')).toBe(true)
            expect(matchTopic('foo.bar.baz', '>')).toBe(true)
        })

        it('does not match shorter topics than pattern', () => {
            expect(matchTopic('foo', 'foo.bar')).toBe(false)
        })

        it('matches _INBOX patterns', () => {
            expect(matchTopic('_INBOX.abc123.1', '_INBOX.>')).toBe(true)
        })

        it('matches JetStream API topics', () => {
            expect(matchTopic(
                '$JS.API.CONSUMER.CREATE.ticket-changes',
                '$JS.API.CONSUMER.CREATE.ticket-changes'
            )).toBe(true)
            expect(matchTopic(
                '$JS.API.CONSUMER.CREATE.ticket-changes.consumer1',
                '$JS.API.CONSUMER.CREATE.ticket-changes.>'
            )).toBe(true)
        })
    })

    describe('Organization-scoped permission enforcement', () => {
        const ORG_A = 'org-aaaa-1111'
        const ORG_B = 'org-bbbb-2222'
        const ORG_C = 'org-cccc-3333'

        let permissionsOrgA

        beforeAll(() => {
            permissionsOrgA = computePermissions(['ticket-changes', 'notification-events'], ORG_A)
        })

        describe('PUB permissions - relay subscription requests (org-scoped)', () => {
            it('allows relay subscribe for own organization', () => {
                expect(isTopicAllowed(
                    `_MESSAGING.subscribe.ticket-changes.${ORG_A}`,
                    permissionsOrgA.pub.allow
                )).toBe(true)
            })

            it('DENIES relay subscribe for different organization', () => {
                expect(isTopicAllowed(
                    `_MESSAGING.subscribe.ticket-changes.${ORG_B}`,
                    permissionsOrgA.pub.allow
                )).toBe(false)
            })

            it('DENIES relay subscribe for third organization', () => {
                expect(isTopicAllowed(
                    `_MESSAGING.subscribe.ticket-changes.${ORG_C}`,
                    permissionsOrgA.pub.allow
                )).toBe(false)
            })

            it('allows relay unsubscribe', () => {
                expect(isTopicAllowed(
                    '_MESSAGING.unsubscribe.relay-123',
                    permissionsOrgA.pub.allow
                )).toBe(true)
            })

            it('cross-org isolation works for all registered channels', () => {
                expect(isTopicAllowed(
                    `_MESSAGING.subscribe.notification-events.${ORG_A}`,
                    permissionsOrgA.pub.allow
                )).toBe(true)

                expect(isTopicAllowed(
                    `_MESSAGING.subscribe.notification-events.${ORG_B}`,
                    permissionsOrgA.pub.allow
                )).toBe(false)
            })

            it('DENIES JetStream API access', () => {
                expect(isTopicAllowed(
                    '$JS.API.CONSUMER.CREATE.ticket-changes',
                    permissionsOrgA.pub.allow
                )).toBe(false)
            })

            it('DENIES direct publish to channel topics', () => {
                expect(isTopicAllowed(
                    `ticket-changes.${ORG_A}.some-ticket`,
                    permissionsOrgA.pub.allow
                )).toBe(false)
            })
        })

        describe('SUB permissions - INBOX only', () => {
            it('allows _INBOX subscriptions for relay message delivery', () => {
                expect(isTopicAllowed(
                    '_INBOX.random-id.1',
                    permissionsOrgA.sub.allow
                )).toBe(true)
            })

            it('DENIES direct channel topic subscriptions', () => {
                expect(isTopicAllowed(
                    `ticket-changes.${ORG_A}.some-ticket-id`,
                    permissionsOrgA.sub.allow
                )).toBe(false)
            })

            it('only allows _INBOX', () => {
                expect(permissionsOrgA.sub.allow).toEqual(['_INBOX.>'])
            })
        })
    })

    describe('End-to-end: token → auth callout → NATS permissions', () => {
        let accountKeyPair
        let accountPublicKey

        beforeAll(() => {
            accountKeyPair = nkeys.createAccount()
            accountPublicKey = accountKeyPair.getPublicKey()
        })

        it('user from org-A gets PUB relay permission ONLY for org-A', () => {
            const orgA = 'org-aaaa-1111'
            const orgB = 'org-bbbb-2222'

            const appToken = jwt.sign(
                { userId: 'user-1', organizationId: orgA, allowedChannels: ['ticket-changes'] },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const decoded = jwt.verify(appToken, TOKEN_SECRET)
            const permissions = computePermissions(decoded.allowedChannels, decoded.organizationId)

            const userNkey = nkeys.createUser().getPublicKey()
            const userJwt = createUserJwt({
                userNkey,
                accountPublicKey,
                permissions,
                signingConfig: { keyPair: accountKeyPair },
                accountName: 'APP',
            })

            const claims = decodeNatsJwt(userJwt)
            const pubAllow = claims.nats.pub.allow

            expect(isTopicAllowed(`_MESSAGING.subscribe.ticket-changes.${orgA}`, pubAllow)).toBe(true)
            expect(isTopicAllowed(`_MESSAGING.subscribe.ticket-changes.${orgB}`, pubAllow)).toBe(false)
        })

        it('different users from different orgs get different PUB relay permissions', () => {
            const orgA = 'org-aaaa-1111'
            const orgB = 'org-bbbb-2222'

            const tokenA = jwt.sign(
                { userId: 'user-A', organizationId: orgA, allowedChannels: ['ticket-changes'] },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )
            const tokenB = jwt.sign(
                { userId: 'user-B', organizationId: orgB, allowedChannels: ['ticket-changes'] },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const decodedA = jwt.verify(tokenA, TOKEN_SECRET)
            const decodedB = jwt.verify(tokenB, TOKEN_SECRET)

            const permsA = computePermissions(decodedA.allowedChannels, decodedA.organizationId)
            const permsB = computePermissions(decodedB.allowedChannels, decodedB.organizationId)

            expect(isTopicAllowed(`_MESSAGING.subscribe.ticket-changes.${orgA}`, permsA.pub.allow)).toBe(true)
            expect(isTopicAllowed(`_MESSAGING.subscribe.ticket-changes.${orgB}`, permsA.pub.allow)).toBe(false)

            expect(isTopicAllowed(`_MESSAGING.subscribe.ticket-changes.${orgB}`, permsB.pub.allow)).toBe(true)
            expect(isTopicAllowed(`_MESSAGING.subscribe.ticket-changes.${orgA}`, permsB.pub.allow)).toBe(false)
        })

        it('user without a stream in allowedChannels gets no relay access to it', () => {
            const orgA = 'org-aaaa-1111'

            const appToken = jwt.sign(
                { userId: 'user-1', organizationId: orgA, allowedChannels: ['notification-events'] },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const decoded = jwt.verify(appToken, TOKEN_SECRET)
            const permissions = computePermissions(decoded.allowedChannels, decoded.organizationId)

            expect(isTopicAllowed(`_MESSAGING.subscribe.ticket-changes.${orgA}`, permissions.pub.allow)).toBe(false)
            expect(isTopicAllowed(`_MESSAGING.subscribe.notification-events.${orgA}`, permissions.pub.allow)).toBe(true)
        })

        it('empty allowedChannels gives minimal permissions', () => {
            const orgA = 'org-aaaa-1111'

            const appToken = jwt.sign(
                { userId: 'user-1', organizationId: orgA, allowedChannels: [] },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const decoded = jwt.verify(appToken, TOKEN_SECRET)
            const permissions = computePermissions(decoded.allowedChannels, decoded.organizationId)

            expect(permissions.pub.allow).toEqual(['_INBOX.>'])
            expect(permissions.sub.allow).toEqual(['_INBOX.>'])

            expect(isTopicAllowed(`ticket-changes.${orgA}.t1`, permissions.sub.allow)).toBe(false)
        })

        it('token organizationId cannot be forged without TOKEN_SECRET', () => {
            const forgedToken = jwt.sign(
                { userId: 'user-1', organizationId: 'other-org', allowedChannels: ['ticket-changes'] },
                // intentionally wrong secret to test that forged tokens are rejected
                // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret
                'wrong-secret',
                { expiresIn: '24h' }
            )

            expect(() => jwt.verify(forgedToken, TOKEN_SECRET)).toThrow()
        })
    })

    describe('CRITICAL: PUB-gated relay security model', () => {
        it('cross-org relay requests are DENIED by PUB permissions', () => {
            const orgA = 'org-aaaa-1111'
            const orgB = 'org-bbbb-2222'
            const permissions = computePermissions(['ticket-changes'], orgA)

            expect(isTopicAllowed(`_MESSAGING.subscribe.ticket-changes.${orgA}`, permissions.pub.allow)).toBe(true)
            expect(isTopicAllowed(`_MESSAGING.subscribe.ticket-changes.${orgB}`, permissions.pub.allow)).toBe(false)
        })

        it('clients have NO direct channel access (PUB-gated relay only)', () => {
            const orgA = 'org-aaaa-1111'
            const permissions = computePermissions(['ticket-changes'], orgA)

            expect(permissions.sub.allow).toEqual(['_INBOX.>'])
            expect(permissions.sub.allow).not.toContain(`ticket-changes.${orgA}.>`)

            expect(permissions.pub.allow).toContain(`_MESSAGING.subscribe.ticket-changes.${orgA}`)
            expect(permissions.pub.allow).not.toContain('$JS.API.CONSUMER.CREATE.ticket-changes')
        })

        it('PUB permissions enforce org isolation (broker-level guarantee)', () => {
            const orgA = 'org-aaaa-1111'
            const orgB = 'org-bbbb-2222'
            const permissions = computePermissions(['ticket-changes'], orgA)

            expect(isTopicAllowed(`_MESSAGING.subscribe.ticket-changes.${orgA}`, permissions.pub.allow)).toBe(true)
            expect(isTopicAllowed(`_MESSAGING.subscribe.ticket-changes.${orgB}`, permissions.pub.allow)).toBe(false)
            expect(isTopicAllowed('_MESSAGING.subscribe.ticket-changes.>', permissions.pub.allow)).toBe(false)
        })
    })
})
