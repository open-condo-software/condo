const { isISO8601Duration } = require('./validations')

describe('isISO8601Duration', () => {
    describe('validate values', () => {
        const cases = [
            ['P1Y2M3DT4H5M6S', true],
            ['P1M', true],
            ['P1MT', true],
            ['P100M', true],
            ['P', true],
        ]
        it.each(cases)('should validate ISO 8601 format value %p', (value, expected) => {
            const isISO8601 = isISO8601Duration(value)
            expect(isISO8601).toBe(expected)
        })
    })
    describe('invalidate values', () => {
        const cases = [
            [123, false],
            [{}, false],
            [NaN, false],
            [null, false],
            [undefined, false],
            ['', false],
            ['123', false],
            ['asd', false],
            ['P1Y2M3DT4H5M6Sqwe', false],
            ['P1M123', false],
            ['P1Y2M3DT4H5M6qweqweS', false],
            ['P1Yasd2M3DT4H5M6S', false],
            ['1M', false],
        ]
        it.each(cases)('should invalidate ISO 8601 format value %p', (value, expected) => {
            const isISO8601 = isISO8601Duration(value)
            expect(isISO8601).toBe(expected)
        })
    })
})