// utils.test.js
const {
    checkHeaderForInjection,
    validateRequestId,
    HEADERS_INJECTION_ERROR,
    REQUEST_ID_VALIDATION_ERROR,
} = require('./headerValidation')

describe('headerValidation', () => {

    describe('checkHeaderForInjection', () => {
        test('should not throw an error for a valid string header', () => {
            expect(() => checkHeaderForInjection('valid-header-value', 'x-custom-header')).not.toThrow()
        })

        test('should throw an error if the header contains newline characters', () => {
            expect(() => checkHeaderForInjection('invalid\r\nheader', 'x-custom-header')).toThrow(HEADERS_INJECTION_ERROR)
        })

        test('should not throw an error for a valid array of strings', () => {
            expect(() => checkHeaderForInjection(['value1', 'value2'], 'x-custom-header')).not.toThrow()
        })

        test('should throw an error if an array of strings contains newline characters', () => {
            expect(() => checkHeaderForInjection(['valid', 'invalid\r\nheader'], 'x-custom-header')).toThrow(HEADERS_INJECTION_ERROR)
        })

        test('should not throw an error for a nested object with valid strings', () => {
            expect(() =>
                checkHeaderForInjection({ key1: 'value1', key2: { subKey: 'valid-value' } }, 'x-custom-header')
            ).not.toThrow()
        })

        test('should throw an error if a nested object contains newline characters', () => {
            expect(() =>
                checkHeaderForInjection({ key1: 'value1', key2: { subKey: 'invalid\r\nheader' } }, 'x-custom-header')
            ).toThrow(HEADERS_INJECTION_ERROR)
        })

        test('should not throw an error for numeric values', () => {
            expect(() => checkHeaderForInjection(123, 'x-custom-header')).not.toThrow()
        })

        test('should throw an error if a numeric value as string contains newline characters', () => {
            expect(() => checkHeaderForInjection('123\r\n', 'x-custom-header')).toThrow(HEADERS_INJECTION_ERROR)
        })

        test('should not throw an error for Date objects', () => {
            expect(() => checkHeaderForInjection(new Date(), 'x-custom-header')).not.toThrow()
        })
    })

    describe('validateRequestId', () => {
        test('should not throw an error for a valid requestId', () => {
            expect(() => validateRequestId('validRequestId123')).not.toThrow()
        })

        test('should throw an error if the requestId contains prohibited characters', () => {
            expect(() => validateRequestId('invalidRequestId!@#$')).toThrow(REQUEST_ID_VALIDATION_ERROR)
        })

        test('should not throw an error for requestId with allowed characters (letters, numbers, /, =, +, -)', () => {
            expect(() => validateRequestId('valid/RequestId=123+-')).not.toThrow()
        })

        test('should throw an error for requestId with spaces', () => {
            expect(() => validateRequestId('request id')).toThrow(REQUEST_ID_VALIDATION_ERROR)
        })
        test('should throw an error for requestId with \r\n symbols', () => {
            expect(() => validateRequestId('requestid\r\nrequestid')).toThrow(REQUEST_ID_VALIDATION_ERROR)
        })
    })

})