const { isValidDateValue } = require('./validation.utils')

describe('validation.utils', () => {
    describe('date functions', () => {
        it('tests date format', () => {
            expect(isValidDateValue('2023-01-01')).toBeTruthy()
            expect(isValidDateValue('2023-02-31')).toBeTruthy()
            expect(isValidDateValue('2023-00-00')).toBeFalsy()
            expect(isValidDateValue('2023-00-01')).toBeFalsy()
            expect(isValidDateValue('2023-01-32')).toBeFalsy()
            expect(isValidDateValue('2023-13-01')).toBeFalsy()
            expect(isValidDateValue('2023-20-01')).toBeFalsy()
            expect(isValidDateValue('3023-01-01')).toBeFalsy()
            expect(isValidDateValue('1923-01-01')).toBeFalsy()
        })
        it('tests date-time format', () => {
            expect(isValidDateValue('2023-01-01T00:00:00.000Z')).toBeTruthy()
            expect(isValidDateValue('2023-01-01T23:59:59.999Z')).toBeTruthy()
            expect(isValidDateValue('2023-01-01T24:59:59.999Z')).toBeFalsy()
            expect(isValidDateValue('2023-01-01T23:60:59.999Z')).toBeFalsy()
            expect(isValidDateValue('2023-01-01T23:59:60.999Z')).toBeFalsy()
        })
    })
})