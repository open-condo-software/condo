// utils.test.js
const {
    validateHeaders,
    HEADERS_INJECTION_ERROR,
    REQUEST_ID_VALIDATION_ERROR,
} = require('./validateHeaders')

describe('validateHeaders', () => {

    describe('checkHeaderForInjection', () => {
        it('should not throw an error for a valid string header', () => {
            expect(() => validateHeaders({ 'x-custom-header': 'valid-header-value' })).not.toThrow()
        })

        it('should throw an error if the header contains newline characters', () => {
            expect(() => validateHeaders({ 'x-custom-header': 'invalid\r\nheader' })).toThrow(HEADERS_INJECTION_ERROR)
        })

        it('should not throw an error for a valid array of strings', () => {
            expect(() => validateHeaders({ 'x-custom-header': ['value1', 'value2'] })).not.toThrow()
        })

        it('should throw an error if an array of strings contains newline characters', () => {
            expect(() => validateHeaders({ 'x-custom-header': ['valid', 'invalid\r\nheader'] } )).toThrow(HEADERS_INJECTION_ERROR)
        })

        it('should not throw an error for a nested object with valid strings', () => {
            expect(() =>
                validateHeaders({ 'x-custom-header': { key1: 'value1', key2: { subKey: 'valid-value' } } } )
            ).not.toThrow()
        })

        it('should throw an error if a nested object contains newline characters', () => {
            expect(() =>
                validateHeaders({ 'x-custom-header': { key1: 'value1', key2: { subKey: 'invalid\r\nheader' } } } )
            ).toThrow(HEADERS_INJECTION_ERROR)
        })

        it('should not throw an error for numeric values', () => {
            expect(() => validateHeaders({ 'x-custom-header': 123 })).not.toThrow()
        })

        it('should throw an error if a numeric value as string contains newline characters', () => {
            expect(() => validateHeaders({ 'x-custom-header': '123\r\n' } )).toThrow(HEADERS_INJECTION_ERROR)
        })

        it('should not throw an error for Date objects', () => {
            expect(() => validateHeaders({ 'x-custom-header': new Date() } )).not.toThrow()
        })
    })

    describe('validateRequestId', () => {
        it('should not throw an error for a valid requestId', () => {
            expect(() => validateHeaders({ 'x-request-id': 'validRequestId123' })).not.toThrow()
        })

        it('should throw an error if the requestId contains prohibited characters', () => {
            expect(() => validateHeaders({ 'x-request-id': 'invalidRequestId!@#$' })).toThrow(REQUEST_ID_VALIDATION_ERROR)
        })

        it('should not throw an error for requestId with allowed characters (letters, numbers, /, =, +, -)', () => {
            expect(() => validateHeaders({ 'x-request-id': 'valid/RequestId=123+-' })).not.toThrow()
        })

        it('should throw an error for requestId with spaces', () => {
            expect(() => validateHeaders({ 'x-request-id': 'request id' })).toThrow(REQUEST_ID_VALIDATION_ERROR)
        })
        it('should throw an error for requestId with \r\n symbols', () => {
            expect(() => validateHeaders({ 'x-request-id': 'requestid\r\nrequestid' })).toThrow(REQUEST_ID_VALIDATION_ERROR)
        })
    })

})