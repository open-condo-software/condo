const crypto = require('crypto')

const { faker } = require('@faker-js/faker')

const { ERRORS } = require('./errors')
const { getXmaAuthDataValidationError, getConfigValidationError, isRedirectUrlValid } = require('./validations')

// XMA uses the same prefix as Telegram for the secret key
const XMA_WEB_APP_DATA_SECRET_PREFIX = 'WebAppData'

function generateValidHash (data, botToken) {
    // There only test (no real) data and 'sha256', 'WebAppData' is publicly available by xma
    // nosemgrep: javascript.lang.security.audit.hardcoded-hmac-key.hardcoded-hmac-key
    const secret = crypto.createHmac('sha256', XMA_WEB_APP_DATA_SECRET_PREFIX)
        .update(botToken.trim())
        .digest()

    const checkString = Object.keys(data)
        .sort()
        .filter((k) => k !== 'hash')
        .map(k => `${k}=${data[k]}`)
        .join('\n')

    return crypto.createHmac('sha256', secret)
        .update(checkString)
        .digest('hex')
}

describe('validations', () => {

    describe('getXmaAuthDataValidationError', () => {

        const mockBotToken = faker.random.alphaNumeric(30)
        const mockAuthDate = Math.floor(Date.now() / 1000)
        const mockUserId = Number(faker.random.numeric(10))

        const baseInitData = {
            user: JSON.stringify({
                id: mockUserId,
                first_name: 'Test',
                last_name: 'User',
                username: 'testuser',
                photo_url: 'https://m**.ru/i/userpic/123/test.jpg',
            }),
            auth_date: mockAuthDate.toString(),
            hash: '',
        }

        describe('Successful validation', () => {
            test('should return null for valid initData', () => {
                const validData = { ...baseInitData }
                validData.hash = generateValidHash(validData, mockBotToken)

                const validationError = getXmaAuthDataValidationError(validData, mockBotToken)
                expect(validationError).toBeNull()
            })

            test('should return null with optional fields', () => {
                const validData = {
                    ...baseInitData,
                    query_id: faker.random.alphaNumeric(36),
                    start_param: 'some_param',
                }
                validData.hash = generateValidHash(validData, mockBotToken)

                const validationError = getXmaAuthDataValidationError(validData, mockBotToken)
                expect(validationError).toBeNull()
            })

            test('should return null when auth_date is just within time limit', () => {
                const validData = {
                    ...baseInitData,
                    auth_date: (Math.floor(Date.now() / 1000) - 4.9 * 60).toString(), // 4.9 min ago
                }
                validData.hash = generateValidHash(validData, mockBotToken)

                const validationError = getXmaAuthDataValidationError(validData, mockBotToken)
                expect(validationError).toBeNull()
            })
        })

        describe('Field validation', () => {
            describe('should return error when required field is missing', () => {
                const requiredFields = ['user', 'auth_date', 'hash']

                test.each(requiredFields)('required: %p', (requiredField) => {
                    const incompleteData = { ...baseInitData }
                    delete incompleteData[requiredField]
                    if (requiredField !== 'hash') {
                        incompleteData.hash = generateValidHash(incompleteData, mockBotToken)
                    }

                    const validationError = getXmaAuthDataValidationError(incompleteData, mockBotToken)
                    expect(validationError).toBe(ERRORS.VALIDATION_AUTH_DATA_KEYS_MISMATCH)
                })
            })

            test('should work with empty optional fields in user object', () => {
                const dataWithEmptyOptionalFields = {
                    ...baseInitData,
                    user: JSON.stringify({
                        ...JSON.parse(baseInitData.user),
                        last_name: '',
                        username: '',
                        photo_url: '',
                    }),
                }
                dataWithEmptyOptionalFields.hash = generateValidHash(dataWithEmptyOptionalFields, mockBotToken)

                const validationError = getXmaAuthDataValidationError(dataWithEmptyOptionalFields, mockBotToken)
                expect(validationError).toBeNull()
            })

            test('should return error when user field contains invalid JSON', () => {
                const invalidData = { ...baseInitData, user: 'not-valid-json' }
                invalidData.hash = generateValidHash(invalidData, mockBotToken)

                const validationError = getXmaAuthDataValidationError(invalidData, mockBotToken)
                expect(validationError).toBe(ERRORS.VALIDATION_AUTH_DATA_KEYS_MISMATCH)
            })

            test('should return error when user object is missing required id field', () => {
                const userWithoutId = { first_name: 'Test', last_name: 'User' }
                const invalidData = { ...baseInitData, user: JSON.stringify(userWithoutId) }
                invalidData.hash = generateValidHash(invalidData, mockBotToken)

                const validationError = getXmaAuthDataValidationError(invalidData, mockBotToken)
                expect(validationError).toBe(ERRORS.VALIDATION_AUTH_DATA_KEYS_MISMATCH)
            })
        })

        describe('Time validation', () => {
            test('should return error when auth data is expired', () => {
                const expiredData = {
                    ...baseInitData,
                    auth_date: (Math.floor(Date.now() / 1000) - 5.1 * 60).toString(), // 5.1 min ago
                }
                expiredData.hash = generateValidHash(expiredData, mockBotToken)

                const validationError = getXmaAuthDataValidationError(expiredData, mockBotToken)
                expect(validationError).toBe(ERRORS.VALIDATION_AUTH_DATA_EXPIRED)
            })

            test('should use custom time limit when provided', () => {
                const customTimeLimit = 60
                const expiredData = {
                    ...baseInitData,
                    auth_date: (Math.floor(Date.now() / 1000) - 2 * 60).toString(), // 2 min ago
                }
                expiredData.hash = generateValidHash(expiredData, mockBotToken)

                const validationError = getXmaAuthDataValidationError(expiredData, mockBotToken, customTimeLimit)
                expect(validationError).toBe(ERRORS.VALIDATION_AUTH_DATA_EXPIRED)
            })
        })

        describe('Hash validation', () => {
            test('should return error when hash is invalid', () => {
                const tamperedData = { ...baseInitData }
                tamperedData.hash = generateValidHash(tamperedData, mockBotToken)
                tamperedData.hash = tamperedData.hash.slice(0, -1) + 'x'

                const validationError = getXmaAuthDataValidationError(tamperedData, mockBotToken)
                expect(validationError).toBe(ERRORS.VALIDATION_AUTH_DATA_SIGN_INVALID)
            })

            test('should return error when bot token is wrong', () => {
                const validData = { ...baseInitData }
                validData.hash = generateValidHash(validData, mockBotToken)

                const validationError = getXmaAuthDataValidationError(validData, 'wrong_bot_token')
                expect(validationError).toBe(ERRORS.VALIDATION_AUTH_DATA_SIGN_INVALID)
            })

            test('should return error when bot token is empty', () => {
                const validData = { ...baseInitData }
                validData.hash = generateValidHash(validData, mockBotToken)

                const validationError = getXmaAuthDataValidationError(validData, '')
                expect(validationError).toBe(ERRORS.VALIDATION_AUTH_DATA_SIGN_INVALID)
            })
        })
    })

    describe('getConfigValidationError', () => {

        const validConfig = [
            {
                botId: '123456',
                botToken: 'fake-bot-token-1',
                allowedRedirectUrls: ['https://example.com', 'https://app.example.com'],
                allowedUserType: 'resident',
            },
        ]

        test('should return null for a valid config', () => {
            expect(getConfigValidationError(validConfig)).toBeNull()
        })

        test('should return null for an empty config array', () => {
            expect(getConfigValidationError([])).toBeNull()
        })

        test('should return null for multiple valid configs', () => {
            const multiConfig = [
                ...validConfig,
                {
                    botId: '234567',
                    botToken: 'fake-bot-token-2',
                    allowedRedirectUrls: ['https://staff.example.com'],
                    allowedUserType: 'staff',
                },
            ]
            expect(getConfigValidationError(multiConfig)).toBeNull()
        })

        test('should return error for duplicate botIds', () => {
            const duplicateConfig = [
                ...validConfig,
                { ...validConfig[0] },
            ]
            const error = getConfigValidationError(duplicateConfig)
            expect(error).toMatchObject({ type: ERRORS.INVALID_CONFIG.type })
            expect(error.data.reason).toMatch(/Duplicate bot ids/)
        })

        describe('missing required fields', () => {
            const requiredFields = ['botId', 'botToken', 'allowedUserType', 'allowedRedirectUrls']

            test.each(requiredFields)('should return error when "%s" is missing', (field) => {
                const incompleteConfig = [{ ...validConfig[0] }]
                delete incompleteConfig[0][field]
                const error = getConfigValidationError(incompleteConfig)
                expect(error).toMatchObject({ type: ERRORS.INVALID_CONFIG.type })
                expect(error.data.reason).toContain(field)
            })
        })

        test('should return error when allowedRedirectUrls is not an array', () => {
            const badConfig = [{ ...validConfig[0], allowedRedirectUrls: 'https://example.com' }]
            const error = getConfigValidationError(badConfig)
            expect(error).toMatchObject({ type: ERRORS.INVALID_CONFIG.type })
            expect(error.data.reason).toContain('allowedRedirectUrls')
        })

        test('should return error when allowedRedirectUrls contains an invalid URL', () => {
            const badConfig = [{ ...validConfig[0], allowedRedirectUrls: ['not-a-valid-url'] }]
            const error = getConfigValidationError(badConfig)
            expect(error).toMatchObject({ type: ERRORS.INVALID_CONFIG.type })
            expect(error.data.reason).toContain('allowedRedirectUrls')
        })

        test('should return error when allowedUserType is empty', () => {
            const badConfig = [{ ...validConfig[0], allowedUserType: '' }]
            const error = getConfigValidationError(badConfig)
            expect(error).toMatchObject({ type: ERRORS.INVALID_CONFIG.type })
            expect(error.data.reason).toContain('allowedUserType')
        })

        test('should return error when allowedUserType is not a string', () => {
            const badConfig = [{ ...validConfig[0], allowedUserType: 42 }]
            const error = getConfigValidationError(badConfig)
            expect(error).toMatchObject({ type: ERRORS.INVALID_CONFIG.type })
            expect(error.data.reason).toContain('allowedUserType')
        })
    })

    describe('isRedirectUrlValid', () => {
        const allowedUrls = [faker.internet.url(), faker.internet.url(), faker.internet.url()]
        const notAllowedUrl = faker.internet.url()
        const allowedUrlWithDifferentPathname = `${allowedUrls[0]}/${faker.random.alpha(10)}`
        const allowedUrlWithQueryParams = `${allowedUrls[0]}?${faker.random.alpha(10)}=${faker.random.alphaNumeric(10)}}`

        const testCases = [
            { name: 'Works with allowed url 1', url: allowedUrls[0], expected: true },
            { name: 'Works with allowed url 2', url: allowedUrls[1], expected: true },
            { name: 'Does not work with not allowed url', url: notAllowedUrl, expected: false },
            { name: 'Does not work if allowed url has different pathname', url: allowedUrlWithDifferentPathname, expected: false },
            { name: 'Works if allowed url has query params', url: allowedUrlWithQueryParams, expected: true },
            { name: 'Does not work if url is invalid', url: undefined, expected: false },
        ]

        test.each(testCases)('$name', async ({ url, expected }) => {
            expect(isRedirectUrlValid(allowedUrls, url)).toBe(expected)
        })
    })
})
