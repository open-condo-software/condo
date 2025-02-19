const { STAFF, RESIDENT } = require('@condo/domains/user/constants/common')
const { signUniqueKey, verifyUniqueKey, getAuthLink, validateTelegramAuthConfig, parseJson, decodeIdToken, getUserType } = require('@condo/domains/user/integration/telegram/utils')

describe('TelegramUtils', () => {
    describe('getUserType', () => {

        test('should return default RESIDENT if userType is not provided', () => {
            const req = {
                query: {},
            }
            const type = getUserType(req)
            expect(type).toEqual(RESIDENT)
        })

        test('should return the correct type for a valid userType', () => {
            const req = {
                query: {
                    userType: STAFF,
                },
            }
            const type = getUserType(req)
            expect(type).toEqual(STAFF)
        })

        test('should throw an error for an invalid userType', () => {
            const req = {
                query: {
                    userType: 'not-existing',
                },
            }
            expect(() => getUserType(req)).toThrowError('userType is incorrect')
        })
    })
    
    describe('signUniqueKey', () => {
        test('should sign a unique key with a secret key', () => {
            const uniqueKey = 'testKey'
            const secretKey = 'secret'
            const signedKey = signUniqueKey(uniqueKey, secretKey)
            expect(signedKey).toMatch(/^testKey:[a-f0-9]+$/)
        })

        test('should throw an error if parameters are missing', () => {
            expect(() => signUniqueKey()).toThrow('signUniqueKey wrong params')
        })
    })

    describe('verifyUniqueKey', () => {
        it('should return uniqueKey if signature matches', () => {
            const uniqueKey = 'testKey'
            const secretKey = 'secret'
            const signedKey = signUniqueKey(uniqueKey, secretKey)
            expect(verifyUniqueKey(signedKey, secretKey)).toBe(uniqueKey)
        })

        it('should return null if signature does not match', () => {
            expect(verifyUniqueKey('testKey:wrongSignature', 'secret')).toBeNull()
        })
    })

    describe('getAuthLink', () => {
        test('should generate an authentication link', () => {
            const config = { authUrl: 'https://auth.com', clientId: 'client123', callbackUrl: 'https://callback.com' }
            const checks = { state: 'abc123', nonce: 'nonce123' }
            const link = getAuthLink(config, checks)
            expect(link).toContain('nonce=nonce123')
            expect(link).toContain('state=abc123')
            expect(link).toContain('clientId=client123')
            expect(link).toContain(`redirectUri=${encodeURIComponent('https://callback.com')}`)
        })
    })

    describe('validateTelegramAuthConfig', () => {
        test('should throw an error if required fields are missing', () => {
            expect(() => validateTelegramAuthConfig({ authUrl: 'test' })).toThrow(/Missing required fields/)
        })
    })

    describe('parseJson', () => {
        test('should parse valid JSON', () => {
            expect(parseJson('{"key":"value"}')).toEqual({ key: 'value' })
        })

        test('should return null for invalid JSON', () => {
            expect(parseJson('invalid')).toBeNull()
        })
    })

    describe('decodeIdToken', () => {
        test('should decode a valid JWT token', () => {
            const mockPayload = { sub: '12345' }
            const encodedPayload = Buffer.from(JSON.stringify(mockPayload)).toString('base64')
            const token = `header.${encodedPayload}.signature`
            expect(decodeIdToken(token)).toEqual(mockPayload)
        })
    })
})
