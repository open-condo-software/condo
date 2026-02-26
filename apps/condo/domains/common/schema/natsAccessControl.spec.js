const jwt = require('jsonwebtoken')
const nkeys = require('nkeys.js')

const conf = require('@open-condo/config')
const { computePermissions, createUserJwt, decodeNatsJwt } = require('@open-condo/messaging/adapters/nats')
const { matchTopic, isTopicAllowed } = require('@open-condo/messaging/utils')

const TOKEN_SECRET = conf.MESSAGING_TOKEN_SECRET

describe('Messaging Access Control — unit', () => {
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
    })

    describe('Two-channel permission enforcement', () => {
        const USER_A = 'user-aaaa-1111'
        const ORG_A = 'org-aaaa-1111'
        const ORG_B = 'org-bbbb-2222'

        let perms

        beforeAll(() => {
            perms = computePermissions(USER_A, ORG_A)
        })

        describe('PUB permissions — relay subscribe topics', () => {
            it('allows relay subscribe for own user channel entity', () => {
                expect(isTopicAllowed(
                    `_MESSAGING.subscribe.user.${USER_A}.notification`,
                    perms.pub.allow
                )).toBe(true)
            })

            it('DENIES relay subscribe for different user channel', () => {
                expect(isTopicAllowed(
                    '_MESSAGING.subscribe.user.user-other.notification',
                    perms.pub.allow
                )).toBe(false)
            })

            it('allows relay subscribe for own organization entity', () => {
                expect(isTopicAllowed(
                    `_MESSAGING.subscribe.organization.${ORG_A}.ticket`,
                    perms.pub.allow
                )).toBe(true)
            })

            it('allows relay subscribe for any entity in own organization', () => {
                expect(isTopicAllowed(
                    `_MESSAGING.subscribe.organization.${ORG_A}.ticketComment`,
                    perms.pub.allow
                )).toBe(true)
            })

            it('DENIES relay subscribe for different organization', () => {
                expect(isTopicAllowed(
                    `_MESSAGING.subscribe.organization.${ORG_B}.ticket`,
                    perms.pub.allow
                )).toBe(false)
            })

            it('allows relay unsubscribe', () => {
                expect(isTopicAllowed(
                    '_MESSAGING.unsubscribe.relay-123',
                    perms.pub.allow
                )).toBe(true)
            })

            it('DENIES direct publish to channel topics', () => {
                expect(isTopicAllowed(
                    `organization.${ORG_A}.ticket`,
                    perms.pub.allow
                )).toBe(false)
            })
        })

        describe('SUB permissions — INBOX only', () => {
            it('allows _INBOX subscriptions for relay message delivery', () => {
                expect(isTopicAllowed('_INBOX.random-id.1', perms.sub.allow)).toBe(true)
            })

            it('DENIES direct channel topic subscriptions', () => {
                expect(isTopicAllowed(`organization.${ORG_A}.ticket`, perms.sub.allow)).toBe(false)
                expect(isTopicAllowed(`user.${USER_A}.notification`, perms.sub.allow)).toBe(false)
            })

            it('only allows _INBOX', () => {
                expect(perms.sub.allow).toEqual(['_INBOX.>'])
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
            const userId = 'user-1'
            const orgA = 'org-aaaa-1111'
            const orgB = 'org-bbbb-2222'

            const appToken = jwt.sign(
                { userId, organizationId: orgA },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const decoded = jwt.verify(appToken, TOKEN_SECRET)
            const permissions = computePermissions(decoded.userId, decoded.organizationId)

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

            expect(isTopicAllowed(`_MESSAGING.subscribe.organization.${orgA}.ticket`, pubAllow)).toBe(true)
            expect(isTopicAllowed(`_MESSAGING.subscribe.organization.${orgB}.ticket`, pubAllow)).toBe(false)
            expect(isTopicAllowed(`_MESSAGING.subscribe.user.${userId}.notification`, pubAllow)).toBe(true)
        })

        it('different users from different orgs get different PUB relay permissions', () => {
            const orgA = 'org-aaaa-1111'
            const orgB = 'org-bbbb-2222'

            const permsA = computePermissions('user-A', orgA)
            const permsB = computePermissions('user-B', orgB)

            expect(isTopicAllowed(`_MESSAGING.subscribe.organization.${orgA}.ticket`, permsA.pub.allow)).toBe(true)
            expect(isTopicAllowed(`_MESSAGING.subscribe.organization.${orgB}.ticket`, permsA.pub.allow)).toBe(false)

            expect(isTopicAllowed(`_MESSAGING.subscribe.organization.${orgB}.ticket`, permsB.pub.allow)).toBe(true)
            expect(isTopicAllowed(`_MESSAGING.subscribe.organization.${orgA}.ticket`, permsB.pub.allow)).toBe(false)

            expect(isTopicAllowed('_MESSAGING.subscribe.user.user-A.notification', permsA.pub.allow)).toBe(true)
            expect(isTopicAllowed('_MESSAGING.subscribe.user.user-B.notification', permsA.pub.allow)).toBe(false)
        })

        it('token organizationId cannot be forged without TOKEN_SECRET', () => {
            const forgedToken = jwt.sign(
                { userId: 'user-1', organizationId: 'other-org' },
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
            const permissions = computePermissions('user-1', orgA)

            expect(isTopicAllowed(`_MESSAGING.subscribe.organization.${orgA}.ticket`, permissions.pub.allow)).toBe(true)
            expect(isTopicAllowed(`_MESSAGING.subscribe.organization.${orgB}.ticket`, permissions.pub.allow)).toBe(false)
        })

        it('cross-user relay requests are DENIED by PUB permissions', () => {
            const permissions = computePermissions('user-1', 'org-1')

            expect(isTopicAllowed('_MESSAGING.subscribe.user.user-1.notification', permissions.pub.allow)).toBe(true)
            expect(isTopicAllowed('_MESSAGING.subscribe.user.user-2.notification', permissions.pub.allow)).toBe(false)
        })

        it('clients have NO direct channel access (PUB-gated relay only)', () => {
            const orgA = 'org-aaaa-1111'
            const permissions = computePermissions('user-1', orgA)

            expect(permissions.sub.allow).toEqual(['_INBOX.>'])
            expect(permissions.sub.allow).not.toContain(`organization.${orgA}.>`)

            expect(isTopicAllowed(`_MESSAGING.subscribe.organization.${orgA}.ticket`, permissions.pub.allow)).toBe(true)
        })

        it('PUB permissions enforce org isolation (broker-level guarantee)', () => {
            const orgA = 'org-aaaa-1111'
            const orgB = 'org-bbbb-2222'
            const permissions = computePermissions('user-1', orgA)

            expect(isTopicAllowed(`_MESSAGING.subscribe.organization.${orgA}.ticket`, permissions.pub.allow)).toBe(true)
            expect(isTopicAllowed(`_MESSAGING.subscribe.organization.${orgB}.ticket`, permissions.pub.allow)).toBe(false)
        })
    })
})
