const nkeys = require('nkeys.js')

const {
    encodeNatsJwt,
    decodeNatsJwt,
    createUserJwt,
    createAuthResponseJwt,
    computePermissions,
} = require('@open-condo/messaging/adapters/nats')

describe('NATS JWT Utilities', () => {
    let accountKeyPair
    let accountPublicKey

    beforeAll(() => {
        accountKeyPair = nkeys.createAccount()
        accountPublicKey = accountKeyPair.getPublicKey()
    })

    describe('encodeNatsJwt / decodeNatsJwt', () => {
        it('encodes and decodes a simple claim', () => {
            const claims = {
                jti: 'test-jti',
                iat: Math.floor(Date.now() / 1000),
                iss: accountPublicKey,
                sub: 'test-subject',
                nats: { type: 'test', version: 2 },
            }

            const encoded = encodeNatsJwt(claims, { keyPair: accountKeyPair })
            expect(typeof encoded).toBe('string')
            expect(encoded.split('.')).toHaveLength(3)

            const decoded = decodeNatsJwt(encoded)
            expect(decoded.jti).toBe('test-jti')
            expect(decoded.iss).toBe(accountPublicKey)
            expect(decoded.sub).toBe('test-subject')
            expect(decoded.nats.type).toBe('test')
        })

        it('throws on invalid JWT format', () => {
            expect(() => decodeNatsJwt('invalid')).toThrow('Invalid NATS JWT format')
            expect(() => decodeNatsJwt('a.b')).toThrow('Invalid NATS JWT format')
        })
    })

    describe('createUserJwt', () => {
        it('creates a valid user JWT with permissions', () => {
            const userNkey = nkeys.createUser().getPublicKey()
            const permissions = {
                pub: { allow: ['_INBOX.>'] },
                sub: { allow: ['_INBOX.>', 'organization.org123.>'] },
            }

            const jwt = createUserJwt({
                userNkey,
                accountPublicKey,
                permissions,
                signingConfig: { keyPair: accountKeyPair },
                accountName: 'APP',
            })

            expect(typeof jwt).toBe('string')

            const decoded = decodeNatsJwt(jwt)
            expect(decoded.iss).toBe(accountPublicKey)
            expect(decoded.sub).toBe(userNkey)
            expect(decoded.aud).toBe('APP')
            expect(decoded.nats.type).toBe('user')
            expect(decoded.nats.version).toBe(2)
            expect(decoded.nats.pub.allow).toEqual(['_INBOX.>'])
            expect(decoded.nats.sub.allow).toContain('organization.org123.>')
            expect(decoded.nats.issuer_account).toBeUndefined()
        })

        it('denies all by default when no permissions given', () => {
            const userNkey = nkeys.createUser().getPublicKey()

            const jwt = createUserJwt({
                userNkey,
                accountPublicKey,
                permissions: {},
                signingConfig: { keyPair: accountKeyPair },
            })

            const decoded = decodeNatsJwt(jwt)
            expect(decoded.nats.pub).toEqual({ deny: ['>'] })
            expect(decoded.nats.sub).toEqual({ deny: ['>'] })
        })
    })

    describe('createAuthResponseJwt', () => {
        it('creates a success response with user JWT', () => {
            const userNkey = nkeys.createUser().getPublicKey()
            const serverId = 'server-abc'
            const userJwt = 'mock-user-jwt'

            const responseJwt = createAuthResponseJwt({
                userNkey,
                serverId,
                accountPublicKey,
                userJwt,
                signingConfig: { keyPair: accountKeyPair },
            })

            const decoded = decodeNatsJwt(responseJwt)
            expect(decoded.iss).toBe(accountPublicKey)
            expect(decoded.sub).toBe(userNkey)
            expect(decoded.aud).toBe(serverId)
            expect(decoded.nats.type).toBe('authorization_response')
            expect(decoded.nats.version).toBe(2)
            expect(decoded.nats.jwt).toBe('mock-user-jwt')
            expect(decoded.nats.issuer_account).toBeUndefined()
            expect(decoded.nats.error).toBeUndefined()
        })

        it('creates an error response without user JWT', () => {
            const userNkey = nkeys.createUser().getPublicKey()
            const serverId = 'server-abc'

            const responseJwt = createAuthResponseJwt({
                userNkey,
                serverId,
                accountPublicKey,
                error: 'Access denied',
                signingConfig: { keyPair: accountKeyPair },
            })

            const decoded = decodeNatsJwt(responseJwt)
            expect(decoded.nats.error).toBe('Access denied')
            expect(decoded.nats.jwt).toBeUndefined()
            expect(decoded.nats.issuer_account).toBeUndefined()
        })
    })

    describe('computePermissions', () => {
        it('computes correct PUB-gated relay permissions for user and organization', () => {
            const perms = computePermissions('user-123', 'org-123')

            expect(perms.pub.allow).toContain('_INBOX.>')
            expect(perms.pub.allow).toContain('_MESSAGING.subscribe.user.user-123.>')
            expect(perms.pub.allow).toContain('_MESSAGING.subscribe.organization.org-123.>')
            expect(perms.pub.allow).toContain('_MESSAGING.unsubscribe.*')

            expect(perms.sub.allow).toEqual(['_INBOX.>'])
        })

        it('does not grant JetStream API or direct channel SUB access', () => {
            const perms = computePermissions('user-123', 'org-123')

            for (const pattern of perms.pub.allow) {
                expect(pattern).not.toMatch(/\$JS\.API/)
            }
            expect(perms.sub.allow).not.toContain('organization.org-123.>')
            expect(perms.sub.allow).not.toContain('user.user-123.>')
        })

        it('scopes user relay to own userId only', () => {
            const perms = computePermissions('user-abc', 'org-456')

            expect(perms.pub.allow).toContain('_MESSAGING.subscribe.user.user-abc.>')
            expect(perms.pub.allow).not.toContain('_MESSAGING.subscribe.user.user-other.>')
        })

        it('scopes organization relay to own orgId only', () => {
            const perms = computePermissions('user-abc', 'org-456')

            expect(perms.pub.allow).toContain('_MESSAGING.subscribe.organization.org-456.>')
            expect(perms.pub.allow).not.toContain('_MESSAGING.subscribe.organization.org-other.>')
        })
    })
})
