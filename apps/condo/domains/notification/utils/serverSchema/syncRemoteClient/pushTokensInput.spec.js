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
                testName: 'exactly 2 voip tokens for same transport',
                tokens: [
                    { token: 'token1', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false },
                    { token: 'token2', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false },
                ],
            },
            {
                testName: 'more than 2 different tokens for same transport',
                tokens: [
                    { token: 'token1', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                    { token: 'token2', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: true, pushType: 'simple' },
                    { token: 'token3', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false, pushType: 'simple' },
                ],
                expectedError: PUSH_TOKENS_VALIDATION_ERRORS.TOO_MANY_TOKENS_FOR_TRANSPORT,
            },
            {
                testName: 'exactly 2 voip and 1 simple tokens for same transport',
                tokens: [
                    { token: 'token1', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false },
                    { token: 'token2', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false },
                    { token: 'token3', transport: 'ios', canBeUsedAsVoIP: false, canBeUsedAsSimplePush: true },
                ],
            },
            {
                testName: '1 token for everything in different objects and 1 simple token for same transport',
                tokens: [
                    { token: 'token1', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false },
                    { token: 'token1', transport: 'ios', canBeUsedAsVoIP: false, canBeUsedAsSimplePush: true },
                    { token: 'token3', transport: 'ios', canBeUsedAsVoIP: false, canBeUsedAsSimplePush: true },
                ],
            },
            {
                testName: 'exactly 1 token for everything and 1 simple token for same transport',
                tokens: [
                    { token: 'token1', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: true },
                    { token: 'token3', transport: 'ios', canBeUsedAsVoIP: false, canBeUsedAsSimplePush: true },
                ],
            },
        ])('should return TOO_MANY_TOKENS_FOR_TRANSPORT error when $testName', ({ tokens }) => {
            const error = getPushTokensValidationError(tokens)
            expect(error).toEqual(PUSH_TOKENS_VALIDATION_ERRORS.TOO_MANY_TOKENS_FOR_TRANSPORT)
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

        test('tries to preserve original order', () => {
            // Test that duplicate tokens are merged while preserving the order of first occurrence
            const inputTokens = [
                { token: '3', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false },
                { token: '4', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: true },
                { token: '1', transport: 'android', canBeUsedAsVoIP: false, canBeUsedAsSimplePush: true },
                { token: '3', transport: 'ios', canBeUsedAsVoIP: false, canBeUsedAsSimplePush: true }, // duplicate of first
                { token: '2', transport: 'ios', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false },
                { token: '1', transport: 'android', canBeUsedAsVoIP: true, canBeUsedAsSimplePush: false }, // duplicate of second
            ]
            
            const result = deduplicatePushTokens(inputTokens)
            
            // Should have 4 tokens after deduplication (one for each unique token)
            expect(result).toHaveLength(4)
            
            // The order should preserve the first occurrence position of each unique token
            // Token '3' appears first in original array, so it should be at index 0 after deduplication
            // Token '4' appears second in original array, so it should be at index 1
            // Token '1' appears third in original array, so it should be at index 2
            // Token '2' appears fourth in original array, so it should be at index 3
            expect(result[0].token).toBe('3')
            expect(result[1].token).toBe('4')
            expect(result[2].token).toBe('1')
            expect(result[3].token).toBe('2')
            
        })

    })
})