const crypto = require('crypto')

const { faker } = require('@faker-js/faker')

const { validateTgAuthData } = require('./validations')

describe('validations', () => {

    describe('validateTgAuthData', () => {

        const mockBotToken = faker.random.alphaNumeric(30)
        const mockAuthDate = Date.now()
        const mockUserId = faker.datatype.uuid()

        function generateValidHash (data, botToken, isMiniAppInitData = false) {
            // There only test (no real) data and 'sha256', 'WebAppData' is publicly available by telegram
            // nosemgrep: javascript.lang.security.audit.hardcoded-hmac-key.hardcoded-hmac-key
            const secret = (isMiniAppInitData ? crypto.createHmac('sha256', 'WebAppData') : crypto.createHash('sha256'))
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

        describe('Telegram oauth callback', () => {

            const baseAuthData = {
                id: mockUserId,
                first_name: 'Test',
                last_name: 'User',
                username: 'testuser',
                photo_url: 'https://t.me/i/userpic/123/test.jpg',
                auth_date: mockAuthDate.toString(),
                hash: '',
            }

            describe('Successful validation', () => {
                test('should return null for valid auth data', () => {
                    const validData = { ...baseAuthData }
                    validData.hash = generateValidHash(validData, mockBotToken)

                    const result = validateTgAuthData(validData, mockBotToken)
                    expect(result).toBeNull()
                })

                test('should work with empty optional fields', () => {
                    const dataWithEmptyOptionalFields = {
                        ...baseAuthData,
                        last_name: '',
                        username: '',
                        photo_url: '',
                    }
                    dataWithEmptyOptionalFields.hash = generateValidHash(
                        dataWithEmptyOptionalFields,
                        mockBotToken
                    )

                    const result = validateTgAuthData(dataWithEmptyOptionalFields, mockBotToken)
                    expect(result).toBeNull()
                })

                test('should not return error when auth data is just within time limit', () => {
                    const justValidData = {
                        ...baseAuthData,
                        auth_date: (Date.now() - 4.9 * 60 * 1000).toString(), // 4.9 min ago
                    }
                    justValidData.hash = generateValidHash(justValidData, mockBotToken)

                    const result = validateTgAuthData(justValidData, mockBotToken)
                    expect(result).toBeNull()
                })
            })

            describe('Field validation', () => {
                test('should return error when data has extra fields', () => {
                    const invalidData = { ...baseAuthData, extra_field: 'value' }
                    invalidData.hash = generateValidHash(invalidData, mockBotToken)

                    const result = validateTgAuthData(invalidData, mockBotToken)
                    expect(result).toBe('VALIDATION_AUTH_DATA_KEYS_MISMATCH')
                })

                describe('should return error when required field is missing', () => {
                    const requiredFields = [
                        'id',
                        'auth_date',
                        'hash',
                    ]

                    test.each(requiredFields)('required: %p', (requiredField) => {
                        const incompleteData = { ...baseAuthData }
                        delete incompleteData[requiredField]
                        if (requiredField !== 'hash') {
                            incompleteData.hash = generateValidHash(incompleteData, mockBotToken)
                        }

                        const result = validateTgAuthData(incompleteData, mockBotToken)
                        expect(result).toBe('VALIDATION_AUTH_DATA_KEYS_MISMATCH')
                    })
                })
            })

            describe('Time validation', () => {
                test('should return error when auth data is expired', () => {
                    const expiredData = {
                        ...baseAuthData,
                        auth_date: (Math.floor(Date.now() / 1000) - 5.1 * 60).toString(), // 5.1 min ago
                    }
                    expiredData.hash = generateValidHash(expiredData, mockBotToken)

                    const result = validateTgAuthData(expiredData, mockBotToken)
                    expect(result).toBe('VALIDATION_AUTH_DATA_EXPIRED')
                })

                test('should use custom time limit when provided', () => {
                    const customTimeLimit = 60
                    const expiredData = {
                        ...baseAuthData,
                        auth_date: (Math.floor(Date.now() / 1000) - 2 * 60).toString(), // 1.1 min ago
                    }
                    expiredData.hash = generateValidHash(expiredData, mockBotToken)

                    const result = validateTgAuthData(expiredData, mockBotToken, customTimeLimit)
                    expect(result).toBe('VALIDATION_AUTH_DATA_EXPIRED')
                })
            })

            describe('Hash validation', () => {
                test('should return error when hash is invalid', () => {
                    const tamperedData = { ...baseAuthData }
                    tamperedData.hash = generateValidHash(tamperedData, mockBotToken)
                    tamperedData.hash = tamperedData.hash.slice(0, -1) + 'x'

                    const result = validateTgAuthData(tamperedData, mockBotToken)
                    expect(result).toBe('VALIDATION_AUTH_DATA_SIGN_INVALID')
                })

                test('should return error when bot token is wrong', () => {
                    const wrongBotToken = 'wrong_bot_token'
                    const validData = { ...baseAuthData }
                    validData.hash = generateValidHash(validData, mockBotToken)

                    const result = validateTgAuthData(validData, wrongBotToken)
                    expect(result).toBe('VALIDATION_AUTH_DATA_SIGN_INVALID')
                })

                test('should return error when bot token is empty', () => {
                    const validData = { ...baseAuthData }
                    validData.hash = generateValidHash(validData, mockBotToken)

                    const result = validateTgAuthData(validData, '')
                    expect(result).toBe('VALIDATION_AUTH_DATA_SIGN_INVALID')
                })
            })
        })

        describe('Telegram Mini App initData', () => {

            const baseInitData = {
                user: JSON.stringify({
                    id: mockUserId,
                    first_name: 'Test',
                    last_name: 'User',
                    username: 'testuser',
                    photo_url: 'https://t.me/i/userpic/123/test.jpg',
                }),
                auth_date: mockAuthDate.toString(),
                query_id: faker.random.alphaNumeric(36),
                signature: faker.random.alphaNumeric(36),
                hash: '',
            }

            describe('Successful validation', () => {
                test('should return null for valid initData', () => {
                    const validData = { ...baseInitData }
                    validData.hash = generateValidHash(validData, mockBotToken, true)

                    const result = validateTgAuthData(validData, mockBotToken)
                    expect(result).toBeNull()
                })

                test('should work with empty optional fields', () => {
                    const dataWithEmptyOptionalFields = {
                        ...baseInitData,
                        user: JSON.stringify({
                            ...JSON.parse(baseInitData.user),
                            last_name: '',
                            username: '',
                            photo_url: '',
                        }),
                    }
                    dataWithEmptyOptionalFields.hash = generateValidHash(
                        dataWithEmptyOptionalFields,
                        mockBotToken,
                        true,
                    )

                    const result = validateTgAuthData(dataWithEmptyOptionalFields, mockBotToken)
                    expect(result).toBeNull()
                })

                test('should not return error when auth data is just within time limit', () => {
                    const justValidData = {
                        ...baseInitData,
                        auth_date: (Math.floor(Date.now() / 1000) - 295).toString(),
                    }
                    justValidData.hash = generateValidHash(justValidData, mockBotToken, true)

                    const result = validateTgAuthData(justValidData, mockBotToken)
                    expect(result).toBeNull()
                })
            })

            describe('Field validation', () => {

                describe('should return error when required field is missing', () => {
                    const requiredFields = [
                        'user',
                        'auth_date',
                        'hash',
                    ]

                    test.each(requiredFields)('required: %p', (requiredField) => {
                        const incompleteData = { ...baseInitData }
                        delete incompleteData[requiredField]
                        if (requiredField !== 'hash') {
                            incompleteData.hash = generateValidHash(incompleteData, mockBotToken)
                        }

                        const result = validateTgAuthData(incompleteData, mockBotToken)
                        expect(result).toBe('VALIDATION_AUTH_DATA_KEYS_MISMATCH')
                    })
                })
            })

            describe('Time validation', () => {
                test('should return error when init data is expired', () => {
                    const expiredData = {
                        ...baseInitData,
                        auth_date: (Math.floor(Date.now() / 1000) - 310).toString(),
                    }
                    expiredData.hash = generateValidHash(expiredData, mockBotToken)

                    const result = validateTgAuthData(expiredData, mockBotToken)
                    expect(result).toBe('VALIDATION_AUTH_DATA_EXPIRED')
                })

                test('should use custom time limit when provided', () => {
                    const customTimeLimit = 60
                    const expiredData = {
                        ...baseInitData,
                        auth_date: (Math.floor(Date.now() / 1000) - 120).toString(),
                    }
                    expiredData.hash = generateValidHash(expiredData, mockBotToken)

                    const result = validateTgAuthData(expiredData, mockBotToken, customTimeLimit)
                    expect(result).toBe('VALIDATION_AUTH_DATA_EXPIRED')
                })
            })

            describe('Hash validation', () => {
                test('should return error when hash is invalid', () => {
                    const tamperedData = { ...baseInitData }
                    tamperedData.hash = generateValidHash(tamperedData, mockBotToken)
                    tamperedData.hash = tamperedData.hash.slice(0, -1) + 'x'

                    const result = validateTgAuthData(tamperedData, mockBotToken)
                    expect(result).toBe('VALIDATION_AUTH_DATA_SIGN_INVALID')
                })

                test('should return error when bot token is wrong', () => {
                    const wrongBotToken = 'wrong_bot_token'
                    const validData = { ...baseInitData }
                    validData.hash = generateValidHash(validData, mockBotToken)

                    const result = validateTgAuthData(validData, wrongBotToken)
                    expect(result).toBe('VALIDATION_AUTH_DATA_SIGN_INVALID')
                })

                test('should return error when bot token is empty', () => {
                    const validData = { ...baseInitData }
                    validData.hash = generateValidHash(validData, mockBotToken)

                    const result = validateTgAuthData(validData, '')
                    expect(result).toBe('VALIDATION_AUTH_DATA_SIGN_INVALID')
                })
            })
        })
    })
})