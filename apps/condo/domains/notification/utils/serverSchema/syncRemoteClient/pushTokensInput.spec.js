const {
    getPushTokensValidationError,
    deduplicatePushTokens,
    PUSH_TOKENS_VALIDATION_ERRORS,
} = require('./pushTokensInput')

describe('pushTokensInput', () => {
    describe('getPushTokensValidationError', () => {
        test('should return no error for valid push tokens', () => {
            const validTokens = [
                {
                    token: 'valid-token-1',
                    transport: 'ios',
                    canBeUsedAsVoIP: true,
                    canBeUsedAsSimplePush: false,
                    pushType: 'simple',
                },
                {
                    token: 'valid-token-2',
                    transport: 'android',
                    canBeUsedAsVoIP: false,
                    canBeUsedAsSimplePush: true,
                    pushType: 'simple',
                },
            ]

            const error = getPushTokensValidationError(validTokens)
            expect(error).toBeNull()
        })

        test.each([
            {
                testName: 'both canBeUsedAsVoIP and canBeUsedAsSimplePush are false',
                tokenData: [{
                    token: 'invalid-token',
                    transport: 'ios',
                    canBeUsedAsVoIP: false,
                    canBeUsedAsSimplePush: false,
                    pushType: 'simple',
                }],
                expectedError: PUSH_TOKENS_VALIDATION_ERRORS.TOKEN_WHICH_CANT_BE_USED_IS_NOT_ALLOWED,
            },
            {
                testName: 'token is empty string',
                tokenData: [{
                    token: '',
                    transport: 'ios',
                    canBeUsedAsVoIP: true,
                    canBeUsedAsSimplePush: false,
                    pushType: 'simple',
                }],
                expectedError: PUSH_TOKENS_VALIDATION_ERRORS.PUSH_TOKENS_TOKEN_MUST_NOT_BE_EMPTY,
            },
            {
                testName: 'token is undefined',
                tokenData: [{
                    transport: 'ios',
                    canBeUsedAsVoIP: true,
                    canBeUsedAsSimplePush: false,
                    pushType: 'simple',
                }],
                expectedError: PUSH_TOKENS_VALIDATION_ERRORS.PUSH_TOKENS_TOKEN_MUST_NOT_BE_EMPTY,
            },
            {
                testName: 'token is null',
                tokenData: [{
                    token: null,
                    transport: 'ios',
                    canBeUsedAsVoIP: true,
                    canBeUsedAsSimplePush: false,
                    pushType: 'simple',
                }],
                expectedError: PUSH_TOKENS_VALIDATION_ERRORS.PUSH_TOKENS_TOKEN_MUST_NOT_BE_EMPTY,
            },
        ])('should return appropriate error when $testName', ({ tokenData, expectedError }) => {
            const error = getPushTokensValidationError(tokenData)
            expect(error).toEqual(expectedError)
        })

        test.each([
            {
                testName: 'more than 3 different tokens for same transport',
                tokens: [
                    { token: 'token1', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                    { token: 'token2', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                    { token: 'token3', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                ],
                expectedError: PUSH_TOKENS_VALIDATION_ERRORS.TOO_MANY_TOKENS_FOR_TRANSPORT,
            },
            {
                testName: 'same token has different push types',
                tokens: [
                    { token: 'same-token', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                    { token: 'same-token', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'voip' },
                ],
                expectedError: PUSH_TOKENS_VALIDATION_ERRORS.DIFFERENT_PUSH_TYPES_FOR_SAME_TOKENS_NOT_SUPPORTED,
            },
        ])('should return $expectedError.type error when $testName', ({ tokens, expectedError }) => {
            const error = getPushTokensValidationError(tokens)
            expect(error).toEqual(expectedError)
        })

        test.each([
            {
                testName: 'exactly 2 different tokens for same transport',
                tokens: [
                    { token: 'token1', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                    { token: 'token2', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                ],
            },
            {
                testName: 'different tokens have different push types',
                tokens: [
                    { token: 'token1', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                    { token: 'token2', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'voip' },
                ],
            },
        ])('should not return error when $testName', ({ tokens }) => {
            const error = getPushTokensValidationError(tokens)
            expect(error).toBeNull()
        })
    })

    describe('deduplicatePushTokens', () => {
        test.each([
            {
                testName: 'tokens with same transport and token value',
                tokens: [
                    { token: 'same-token', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                    { token: 'same-token', transport: 'ios', canBeUsedAsVoIP: false, canBeUsedAsSimplePush: true, pushType: 'simple' },
                ],
                expectedLength: 1,
                expectedResult: {
                    token: 'same-token',
                    transport: 'ios',
                    canBeUsedAsVoIP: true,
                    canBeUsedAsSimplePush: true,
                    pushType: 'simple',
                },
            },
            {
                testName: 'single token',
                tokens: [
                    { token: 'single-token', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                ],
                expectedLength: 1,
                expectedResult: {
                    token: 'single-token',
                    transport: 'ios',
                    canBeUsedAsVoIP: true,
                    canBeUsedAsSimplePush: false,
                    pushType: 'simple',
                },
            },
            {
                testName: 'merge canBeUsedAsVoIP and canBeUsedAsSimplePush flags correctly',
                tokens: [
                    { token: 'same-token', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                    { token: 'same-token', transport: 'ios', canBeUsedAsVoIP: false, canBeUsedAsSimplePush: true, pushType: 'simple' },
                    { token: 'same-token', transport: 'ios', canBeUsedAsVoIP: false, canBeUsedAsSimplePush: false, pushType: 'simple' },
                ],
                expectedLength: 1,
                expectedResult: {
                    token: 'same-token',
                    transport: 'ios',
                    canBeUsedAsVoIP: true,
                    canBeUsedAsSimplePush: true,
                    pushType: 'simple',
                },
            },
        ])('should correctly handle $testName', ({ tokens, expectedLength, expectedResult }) => {
            const result = deduplicatePushTokens(tokens)
            expect(result).toHaveLength(expectedLength)
            if (expectedResult) {
                expect(result[0]).toMatchObject(expectedResult)
            }
        })

        test.each([
            {
                testName: 'tokens with different transports',
                tokens: [
                    { token: 'same-token', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                    { token: 'same-token', transport: 'android', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                ],
                expectedLength: 2,
            },
            {
                testName: 'tokens with different tokens',
                tokens: [
                    { token: 'token1', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                    { token: 'token2', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                ],
                expectedLength: 2,
            },
        ])('should preserve $testName', ({ tokens, expectedLength }) => {
            const result = deduplicatePushTokens(tokens)
            expect(result).toHaveLength(expectedLength)
        })

        test('should return empty array for empty input', () => {
            const result = deduplicatePushTokens([])
            expect(result).toEqual([])
        })

        test('should preserve the first occurrence properties when deduplicating', () => {
            const tokens = [
                { token: 'same-token', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple', extraProp: 'first' },
                { token: 'same-token', transport: 'ios', canBeUsedAsVoIP: false, canBeUsedAsSimplePush: true, pushType: 'simple', extraProp: 'second' },
            ]

            const result = deduplicatePushTokens(tokens)
            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                token: 'same-token',
                transport: 'ios',
                canBeUsedAsVoIP: true, // OR-ed value
                canBeUsedAsSimplePush: true, // OR-ed value
                pushType: 'simple', // from first occurrence
                extraProp: 'first', // from first occurrence
            })
        })
    })
})