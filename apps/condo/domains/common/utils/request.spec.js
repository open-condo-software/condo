const { hasSpecificHeaders } = require('./request')


const REQUEST_HEADERS = {
    a: '1',
    b: '2',
    c: '3',
}

describe('Request utils', () => {
    describe('hasSpecificHeaders', () => {
        const positiveCases = [
            {
                reqHeaders: REQUEST_HEADERS,
                setsOfSpecificHeaders: [{}], // pass all
            },
            {
                reqHeaders: REQUEST_HEADERS,
                setsOfSpecificHeaders: [{ a: '1' }],
            },
            {
                reqHeaders: REQUEST_HEADERS,
                setsOfSpecificHeaders: [{ a: '1', b: '2' }],
            },
            {
                reqHeaders: REQUEST_HEADERS,
                setsOfSpecificHeaders: [{ a: '1', unexpectedHeader: '2' }, { c: '3' }],
            },
            {
                reqHeaders: REQUEST_HEADERS,
                setsOfSpecificHeaders: [{ a: '1', unexpectedHeader: '2' }, {}],
            },
        ]

        const negativeCases = [
            {
                reqHeaders: REQUEST_HEADERS,
                setsOfSpecificHeaders: [], // skip all
            },
            {
                reqHeaders: REQUEST_HEADERS,
                setsOfSpecificHeaders: [{ a: '1', unexpectedHeader: '2' }],
            },
            {
                reqHeaders: REQUEST_HEADERS,
                setsOfSpecificHeaders: [{ a: '1', b: 'unexpectedValue' }],
            },
        ]

        it.each(positiveCases)('should be return true (case #%#)', ({ reqHeaders, setsOfSpecificHeaders }) => {
            expect(hasSpecificHeaders(reqHeaders, setsOfSpecificHeaders)).toBeTruthy()
        })

        it.each(negativeCases)('should be return false (case #%#)', ({ reqHeaders, setsOfSpecificHeaders }) => {
            expect(hasSpecificHeaders(reqHeaders, setsOfSpecificHeaders)).toBeFalsy()
        })
    })
})