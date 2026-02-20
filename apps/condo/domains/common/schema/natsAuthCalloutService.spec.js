const jwt = require('jsonwebtoken')
const nkeys = require('nkeys.js')

const conf = require('@open-condo/config')
const {
    decodeNatsJwt,
    encodeNatsJwt,
    createUserJwt,
    computePermissions,
} = require('@open-condo/messaging/adapters/nats')

const TOKEN_SECRET = conf.MESSAGING_TOKEN_SECRET

/**
 * Unit tests for the auth callout request/response flow.
 * These test the JWT creation logic without a real NATS connection.
 */
describe('Auth Callout Service Logic', () => {
    let accountKeyPair
    let accountPublicKey

    beforeAll(() => {
        accountKeyPair = nkeys.createAccount()
        accountPublicKey = accountKeyPair.getPublicKey()
    })

    describe('Token validation and response creation', () => {
        it('creates correct user JWT from a valid application token', () => {
            const userNkey = nkeys.createUser().getPublicKey()
            const organizationId = 'org-test-123'
            const allowedChannels = ['ticket-changes', 'notification-events']

            const appToken = jwt.sign(
                { userId: 'user-1', organizationId, allowedChannels },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const decoded = jwt.verify(appToken, TOKEN_SECRET)
            expect(decoded.userId).toBe('user-1')
            expect(decoded.organizationId).toBe(organizationId)
            expect(decoded.allowedChannels).toEqual(allowedChannels)

            const permissions = computePermissions(decoded.allowedChannels, decoded.organizationId)

            const userJwt = createUserJwt({
                userNkey,
                accountPublicKey,
                permissions,
                signingConfig: { keyPair: accountKeyPair },
            })

            const userClaims = decodeNatsJwt(userJwt)
            expect(userClaims.iss).toBe(accountPublicKey)
            expect(userClaims.sub).toBe(userNkey)
            expect(userClaims.nats.type).toBe('user')

            expect(userClaims.nats.sub.allow).toEqual(['_INBOX.>'])

            expect(userClaims.nats.pub.allow).toContain('_INBOX.>')
            expect(userClaims.nats.pub.allow).toContain('_MESSAGING.subscribe.ticket-changes.org-test-123')
            expect(userClaims.nats.pub.allow).toContain('_MESSAGING.subscribe.notification-events.org-test-123')
        })

        it('rejects expired application tokens', () => {
            const appToken = jwt.sign(
                { userId: 'user-1', organizationId: 'org-1', allowedChannels: ['test-changes'] },
                TOKEN_SECRET,
                { expiresIn: '0s' }
            )

            expect(() => jwt.verify(appToken, TOKEN_SECRET)).toThrow()
        })

        it('rejects tokens signed with wrong secret', () => {
            const appToken = jwt.sign(
                { userId: 'user-1', organizationId: 'org-1', allowedChannels: ['test-changes'] },
                // intentionally wrong secret to test that forged tokens are rejected
                // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret
                'wrong-secret',
                { expiresIn: '24h' }
            )

            expect(() => jwt.verify(appToken, TOKEN_SECRET)).toThrow()
        })

        it('handles token without allowedChannels', () => {
            const appToken = jwt.sign(
                { userId: 'user-1', organizationId: 'org-1' },
                TOKEN_SECRET,
                { expiresIn: '24h' }
            )

            const decoded = jwt.verify(appToken, TOKEN_SECRET)
            expect(decoded.allowedChannels).toBeUndefined()
        })
    })

    describe('NATS JWT signing verification', () => {
        it('signs JWTs with ed25519-nkey algorithm', () => {
            const claims = {
                jti: 'test',
                iat: Math.floor(Date.now() / 1000),
                iss: accountPublicKey,
                sub: 'test',
                nats: { type: 'test', version: 2 },
            }

            const encoded = encodeNatsJwt(claims, { keyPair: accountKeyPair })
            const parts = encoded.split('.')
            const header = JSON.parse(Buffer.from(parts[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString())

            expect(header.typ).toBe('JWT')
            expect(header.alg).toBe('ed25519-nkey')
        })

        it('produces different signatures for different claims', () => {
            const claims1 = {
                jti: 'test-1',
                iat: Math.floor(Date.now() / 1000),
                iss: accountPublicKey,
                sub: 'user-1',
                nats: { type: 'user', version: 2 },
            }

            const claims2 = {
                jti: 'test-2',
                iat: Math.floor(Date.now() / 1000),
                iss: accountPublicKey,
                sub: 'user-2',
                nats: { type: 'user', version: 2 },
            }

            const jwt1 = encodeNatsJwt(claims1, { keyPair: accountKeyPair })
            const jwt2 = encodeNatsJwt(claims2, { keyPair: accountKeyPair })

            expect(jwt1).not.toBe(jwt2)

            const sig1 = jwt1.split('.')[2]
            const sig2 = jwt2.split('.')[2]
            expect(sig1).not.toBe(sig2)
        })

        it('uses the account public key as issuer', () => {
            const userNkey = nkeys.createUser().getPublicKey()
            const userJwt = createUserJwt({
                userNkey,
                accountPublicKey,
                permissions: { pub: { allow: [] }, sub: { allow: [] } },
                signingConfig: { keyPair: accountKeyPair },
            })

            const decoded = decodeNatsJwt(userJwt)
            expect(decoded.iss).toBe(accountPublicKey)
            expect(decoded.iss.startsWith('A')).toBe(true)
        })
    })

    describe('Permission scoping', () => {
        it('scopes relay PUB permissions to organization', () => {
            const perms = computePermissions(['ticket-changes'], 'org-abc')

            expect(perms.pub.allow).toContain('_MESSAGING.subscribe.ticket-changes.org-abc')
            expect(perms.pub.allow).not.toContain('_MESSAGING.subscribe.ticket-changes.org-xyz')
        })

        it('does not grant JetStream API or direct stream access', () => {
            const perms = computePermissions(['ticket-changes'], 'org-abc')

            for (const pattern of perms.pub.allow) {
                expect(pattern).not.toMatch(/\$JS\.API/)
            }
            expect(perms.sub.allow).toEqual(['_INBOX.>'])
        })

        it('does not grant publish to stream subjects', () => {
            const perms = computePermissions(['ticket-changes'], 'org-abc')
            const pubAllow = perms.pub.allow

            expect(pubAllow).not.toContain('ticket-changes.org-abc.>')
            expect(pubAllow).not.toContain('ticket-changes.>')
        })
    })
})
