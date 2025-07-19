const { faker } = require('@faker-js/faker')

const { UUID_RE } = require('@open-condo/keystone/test.utils')

const { generateToken, detectTokenType, TOKEN_TYPES, ABBREVIATION_BY_TOKEN_TYPE } = require('./tokens')


describe('token utils', () => {
    describe('detectTokenType', () => {
        it('should throw error if token empty', () => {
            expect(() => detectTokenType('')).toThrow('Invalid token!')
        })

        it('should throw error if token is not string', () => {
            expect(() => detectTokenType(null)).toThrow('Invalid token!')
        })

        it('should throw error if token has invalid format', () => {
            const invalidToken = [ABBREVIATION_BY_TOKEN_TYPE.CONFIRM_PHONE, faker.datatype.uuid()].join('_')
            expect(() => detectTokenType(invalidToken)).toThrow('Invalid token format!')
        })

        it('should throw error if token has unsupported format', () => {
            const unsupportedToken = ['unsupportedType', faker.datatype.uuid()].join(':')
            expect(() => detectTokenType(unsupportedToken)).toThrow('Unsupported token format!')
        })

        it('should return supported token type if correct token', () => {
            const validToken = [ABBREVIATION_BY_TOKEN_TYPE.CONFIRM_PHONE, faker.datatype.uuid()].join(':')
            expect(detectTokenType(validToken)).toBe(TOKEN_TYPES.CONFIRM_PHONE)
        })
    })

    describe('generateToken', () => {
        it('should throw error if empty token type', () => {
            expect(() => generateToken('')).toThrow('Invalid token type!')
        })

        it('should throw error if token type is not string', () => {
            expect(() => generateToken(null)).toThrow('Invalid token type!')
        })

        it('should throw error if token type is unsupported', () => {
            expect(() => generateToken('unsupportedType')).toThrow('Unsupported token type!')
        })

        it('should return token with prefix by token type if token type is supported', () => {
            const token = generateToken(TOKEN_TYPES.CONFIRM_PHONE)
            expect(typeof token).toBe('string')
            const [tokenType, uuid] = token.split(':')
            expect(tokenType).toBe(ABBREVIATION_BY_TOKEN_TYPE.CONFIRM_PHONE)
            expect(uuid).toEqual(expect.stringMatching(UUID_RE))
        })
    })
})