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
                    provider: 'ios',
                    isVoIP: true,
                    isPush: false,
                    pushType: 'simple',
                },
                {
                    token: 'valid-token-2',
                    provider: 'android',
                    isVoIP: false,
                    isPush: true,
                    pushType: 'simple',
                },
            ]

            const error = getPushTokensValidationError(validTokens)
            expect(error).toBeNull()
        })

        test.each([
            {
                testName: 'both isVoIP and isPush are false',
                tokenData: [{
                    token: 'invalid-token',
                    provider: 'ios',
                    isVoIP: false,
                    isPush: false,
                    pushType: 'simple',
                }],
                expectedError: PUSH_TOKENS_VALIDATION_ERRORS.UNUSABLE_TOKEN_PROVIDED,
            },
            {
                testName: 'token is empty string',
                tokenData: [{
                    token: '',
                    provider: 'ios',
                    isVoIP: true,
                    isPush: false,
                    pushType: 'simple',
                }],
                expectedError: PUSH_TOKENS_VALIDATION_ERRORS.INVALID_PUSH_TOKEN,
            },
            {
                testName: 'token is undefined',
                tokenData: [{
                    provider: 'ios',
                    isVoIP: true,
                    isPush: false,
                    pushType: 'simple',
                }],
                expectedError: PUSH_TOKENS_VALIDATION_ERRORS.INVALID_PUSH_TOKEN,
            },
            {
                testName: 'token is null',
                tokenData: [{
                    token: null,
                    provider: 'ios',
                    isVoIP: true,
                    isPush: false,
                    pushType: 'simple',
                }],
                expectedError: PUSH_TOKENS_VALIDATION_ERRORS.INVALID_PUSH_TOKEN,
            },
        ])('should return appropriate error when $testName', ({ tokenData, expectedError }) => {
            const error = getPushTokensValidationError(tokenData)
            expect(error).toEqual(expectedError)
        })

        test.each([
            {
                testName: 'exactly 2 voip tokens for same provider',
                tokens: [
                    { token: 'token1', provider: 'ios', isVoIP: true, isPush: false },
                    { token: 'token2', provider: 'ios', isVoIP: true, isPush: false },
                ],
            },
            {
                testName: 'more than 2 different tokens for same provider',
                tokens: [
                    { token: 'token1', provider: 'ios', isVoIP: true, isPush: false, pushType: 'simple' },
                    { token: 'token2', provider: 'ios', isVoIP: true, isPush: true, pushType: 'simple' },
                    { token: 'token3', provider: 'ios', isVoIP: true, isPush: false, pushType: 'simple' },
                ],
            },
            {
                testName: 'exactly 2 voip and 1 simple tokens for same provider',
                tokens: [
                    { token: 'token1', provider: 'ios', isVoIP: true, isPush: false },
                    { token: 'token2', provider: 'ios', isVoIP: true, isPush: false },
                    { token: 'token3', provider: 'ios', isVoIP: false, isPush: true },
                ],
            },
            {
                testName: '1 token for everything in different objects and 1 simple token for same provider',
                tokens: [
                    { token: 'token1', provider: 'ios', isVoIP: true, isPush: false },
                    { token: 'token1', provider: 'ios', isVoIP: false, isPush: true },
                    { token: 'token3', provider: 'ios', isVoIP: false, isPush: true },
                ],
            },
            {
                testName: 'exactly 1 token for everything and 1 simple token for same provider',
                tokens: [
                    { token: 'token1', provider: 'ios', isVoIP: true, isPush: true },
                    { token: 'token3', provider: 'ios', isVoIP: false, isPush: true },
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
                testName: 'tokens with same provider and token value',
                tokens: [
                    { token: 'same-token', provider: 'ios', isVoIP: true, isPush: false, pushType: 'simple' },
                    { token: 'same-token', provider: 'ios', isVoIP: false, isPush: true, pushType: 'simple' },
                ],
                expectedLength: 1,
                expectedResult: {
                    token: 'same-token',
                    provider: 'ios',
                    isVoIP: true,
                    isPush: true,
                    pushType: 'simple',
                },
            },
            {
                testName: 'single token',
                tokens: [
                    { token: 'single-token', provider: 'ios', isVoIP: true, isPush: false, pushType: 'simple' },
                ],
                expectedLength: 1,
                expectedResult: {
                    token: 'single-token',
                    provider: 'ios',
                    isVoIP: true,
                    isPush: false,
                    pushType: 'simple',
                },
            },
            {
                testName: 'merge isVoIP and isPush flags correctly',
                tokens: [
                    { token: 'same-token', provider: 'ios', isVoIP: true, isPush: false, pushType: 'simple' },
                    { token: 'same-token', provider: 'ios', isVoIP: false, isPush: true, pushType: 'simple' },
                    { token: 'same-token', provider: 'ios', isVoIP: false, isPush: false, pushType: 'simple' },
                ],
                expectedLength: 1,
                expectedResult: {
                    token: 'same-token',
                    provider: 'ios',
                    isVoIP: true,
                    isPush: true,
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
                testName: 'tokens with different providers',
                tokens: [
                    { token: 'same-token', provider: 'ios', isVoIP: true, isPush: false, pushType: 'simple' },
                    { token: 'same-token', provider: 'android', isVoIP: true, isPush: false, pushType: 'simple' },
                ],
                expectedLength: 2,
            },
            {
                testName: 'tokens with different tokens',
                tokens: [
                    { token: 'token1', provider: 'ios', isVoIP: true, isPush: false, pushType: 'simple' },
                    { token: 'token2', provider: 'ios', isVoIP: true, isPush: false, pushType: 'simple' },
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

    })
})