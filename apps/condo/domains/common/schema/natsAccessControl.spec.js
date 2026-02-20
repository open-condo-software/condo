const jwt = require('jsonwebtoken')
const nkeys = require('nkeys.js')

const conf = require('@open-condo/config')
const {
    computePermissions,
    createUserJwt,
    decodeNatsJwt,
    matchNatsSubject,
    isSubjectAllowed,
} = require('@open-condo/nats/utils')

const TOKEN_SECRET = conf.NATS_TOKEN_SECRET

describe('NATS Access Control', () => {
    describe('Subject matching utility', () => {
        it('matches exact subjects', () => {
            expect(matchNatsSubject('foo.bar', 'foo.bar')).toBe(true)
            expect(matchNatsSubject('foo.bar', 'foo.baz')).toBe(false)
        })

        it('matches single-token wildcard (*)', () => {
            expect(matchNatsSubject('foo.bar', 'foo.*')).toBe(true)
            expect(matchNatsSubject('foo.bar.baz', 'foo.*')).toBe(false)
        })

        it('matches multi-token wildcard (>)', () => {
            expect(matchNatsSubject('foo.bar', 'foo.>')).toBe(true)
            expect(matchNatsSubject('foo.bar.baz', 'foo.>')).toBe(true)
            expect(matchNatsSubject('foo', 'foo.>')).toBe(false)
        })

        it('matches full wildcard', () => {
            expect(matchNatsSubject('foo', '>')).toBe(true)
            expect(matchNatsSubject('foo.bar.baz', '>')).toBe(true)
        })

        it('does not match shorter subjects than pattern', () => {
            expect(matchNatsSubject('foo', 'foo.bar')).toBe(false)
        })

        it('matches _INBOX patterns', () => {
            expect(matchNatsSubject('_INBOX.abc123.1', '_INBOX.>')).toBe(true)
        })

        it('matches JetStream API subjects', () => {
            expect(matchNatsSubject(
                '$JS.API.CONSUMER.CREATE.ticket-changes',
                '$JS.API.CONSUMER.CREATE.ticket-changes'
            )).toBe(true)
            expect(matchNatsSubject(
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
                expect(isSubjectAllowed(
                    `_NATS.subscribe.ticket-changes.${ORG_A}`,
                    permissionsOrgA.pub.allow
                )).toBe(true)
            })

            it('DENIES relay subscribe for different organization', () => {
                expect(isSubjectAllowed(
                    `_NATS.subscribe.ticket-changes.${ORG_B}`,
                    permissionsOrgA.pub.allow
                )).toBe(false)
            })

            it('DENIES relay subscribe for third organization', () => {
                expect(isSubjectAllowed(
                    `_NATS.subscribe.ticket-changes.${ORG_C}`,
                    permissionsOrgA.pub.allow
                )).toBe(false)
            })

            it('allows relay unsubscribe', () => {
                expect(isSubjectAllowed(
                    '_NATS.unsubscribe.relay-123',
                    permissionsOrgA.pub.allow
                )).toBe(true)
            })

            it('cross-org isolation works for all registered streams', () => {
                expect(isSubjectAllowed(
                    `_NATS.subscribe.notification-events.${ORG_A}`,
                    permissionsOrgA.pub.allow
                )).toBe(true)

                expect(isSubjectAllowed(
                    `_NATS.subscribe.notification-events.${ORG_B}`,
                    permissionsOrgA.pub.allow
                )).toBe(false)
            })

            it('DENIES JetStream API access', () => {
                expect(isSubjectAllowed(
                    '$JS.API.CONSUMER.CREATE.ticket-changes',
                    permissionsOrgA.pub.allow
                )).toBe(false)
            })

            it('DENIES direct publish to stream subjects', () => {
                expect(isSubjectAllowed(
                    `ticket-changes.${ORG_A}.some-ticket`,
                    permissionsOrgA.pub.allow
                )).toBe(false)
            })
        })

        describe('SUB permissions - INBOX only', () => {
            it('allows _INBOX subscriptions for relay message delivery', () => {
                expect(isSubjectAllowed(
                    '_INBOX.random-id.1',
                    permissionsOrgA.sub.allow
                )).toBe(true)
            })

            it('DENIES direct stream subject subscriptions', () => {
                expect(isSubjectAllowed(
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
                { userId: 'user-1', organizationId: orgA, allowedStreams: ['ticket-changes'] },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const decoded = jwt.verify(appToken, TOKEN_SECRET)
            const permissions = computePermissions(decoded.allowedStreams, decoded.organizationId)

            const userNkey = nkeys.createUser().getPublicKey()
            const userJwt = createUserJwt({
                userNkey,
                accountPublicKey,
                permissions,
                accountKeyPair,
                accountName: 'APP',
            })

            const claims = decodeNatsJwt(userJwt)
            const pubAllow = claims.nats.pub.allow

            expect(isSubjectAllowed(`_NATS.subscribe.ticket-changes.${orgA}`, pubAllow)).toBe(true)
            expect(isSubjectAllowed(`_NATS.subscribe.ticket-changes.${orgB}`, pubAllow)).toBe(false)
        })

        it('different users from different orgs get different PUB relay permissions', () => {
            const orgA = 'org-aaaa-1111'
            const orgB = 'org-bbbb-2222'

            const tokenA = jwt.sign(
                { userId: 'user-A', organizationId: orgA, allowedStreams: ['ticket-changes'] },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )
            const tokenB = jwt.sign(
                { userId: 'user-B', organizationId: orgB, allowedStreams: ['ticket-changes'] },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const decodedA = jwt.verify(tokenA, TOKEN_SECRET)
            const decodedB = jwt.verify(tokenB, TOKEN_SECRET)

            const permsA = computePermissions(decodedA.allowedStreams, decodedA.organizationId)
            const permsB = computePermissions(decodedB.allowedStreams, decodedB.organizationId)

            expect(isSubjectAllowed(`_NATS.subscribe.ticket-changes.${orgA}`, permsA.pub.allow)).toBe(true)
            expect(isSubjectAllowed(`_NATS.subscribe.ticket-changes.${orgB}`, permsA.pub.allow)).toBe(false)

            expect(isSubjectAllowed(`_NATS.subscribe.ticket-changes.${orgB}`, permsB.pub.allow)).toBe(true)
            expect(isSubjectAllowed(`_NATS.subscribe.ticket-changes.${orgA}`, permsB.pub.allow)).toBe(false)
        })

        it('user without a stream in allowedStreams gets no relay access to it', () => {
            const orgA = 'org-aaaa-1111'

            const appToken = jwt.sign(
                { userId: 'user-1', organizationId: orgA, allowedStreams: ['notification-events'] },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const decoded = jwt.verify(appToken, TOKEN_SECRET)
            const permissions = computePermissions(decoded.allowedStreams, decoded.organizationId)

            expect(isSubjectAllowed(`_NATS.subscribe.ticket-changes.${orgA}`, permissions.pub.allow)).toBe(false)
            expect(isSubjectAllowed(`_NATS.subscribe.notification-events.${orgA}`, permissions.pub.allow)).toBe(true)
        })

        it('empty allowedStreams gives minimal permissions', () => {
            const orgA = 'org-aaaa-1111'

            const appToken = jwt.sign(
                { userId: 'user-1', organizationId: orgA, allowedStreams: [] },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const decoded = jwt.verify(appToken, TOKEN_SECRET)
            const permissions = computePermissions(decoded.allowedStreams, decoded.organizationId)

            expect(permissions.pub.allow).toEqual(['_INBOX.>'])
            expect(permissions.sub.allow).toEqual(['_INBOX.>'])

            expect(isSubjectAllowed(`ticket-changes.${orgA}.t1`, permissions.sub.allow)).toBe(false)
        })

        it('token organizationId cannot be forged without TOKEN_SECRET', () => {
            const forgedToken = jwt.sign(
                { userId: 'user-1', organizationId: 'other-org', allowedStreams: ['ticket-changes'] },
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

            expect(isSubjectAllowed(`_NATS.subscribe.ticket-changes.${orgA}`, permissions.pub.allow)).toBe(true)
            expect(isSubjectAllowed(`_NATS.subscribe.ticket-changes.${orgB}`, permissions.pub.allow)).toBe(false)
        })

        it('clients have NO direct stream access (PUB-gated relay only)', () => {
            const orgA = 'org-aaaa-1111'
            const permissions = computePermissions(['ticket-changes'], orgA)

            expect(permissions.sub.allow).toEqual(['_INBOX.>'])
            expect(permissions.sub.allow).not.toContain(`ticket-changes.${orgA}.>`)

            expect(permissions.pub.allow).toContain(`_NATS.subscribe.ticket-changes.${orgA}`)
            expect(permissions.pub.allow).not.toContain('$JS.API.CONSUMER.CREATE.ticket-changes')
        })

        it('PUB permissions enforce org isolation (NATS-level guarantee)', () => {
            const orgA = 'org-aaaa-1111'
            const orgB = 'org-bbbb-2222'
            const permissions = computePermissions(['ticket-changes'], orgA)

            expect(isSubjectAllowed(`_NATS.subscribe.ticket-changes.${orgA}`, permissions.pub.allow)).toBe(true)
            expect(isSubjectAllowed(`_NATS.subscribe.ticket-changes.${orgB}`, permissions.pub.allow)).toBe(false)
            expect(isSubjectAllowed('_NATS.subscribe.ticket-changes.>', permissions.pub.allow)).toBe(false)
        })
    })
})
