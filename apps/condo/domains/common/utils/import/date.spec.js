const dayjs = require('dayjs')

const { clearDateStr, isDateStrValid, tryToISO } = require('@condo/domains/common/utils/import/date')

const validDateStrings = [
    '2024-01-01',
    '01/01/2024',
    '2024/01/01',
    '2024-01-01T00:00:00.000Z',
    '01.01.2024',
    '2024.01.01',
    '01-01-2024',
    '2024-01-01 00:00:00',
    '2024-01-01 00:00',
]

const invalidDateStrings = [
    '',
    '2024-01-35', // Invalid day
    '01/35/2024', // Invalid day
    'invalid-date', // Not a date
    '2024/13/01', // Invalid month
    '2024-01-01T25:00:00Z', // Invalid hour
]

describe('importDate.utils', () => {

    describe('clearDateStr', () => {
        it('should remove invalid characters and return sanitized date string', () => {
            expect(clearDateStr('2024-01-01**')).toBe('2024-01-01')
            expect(clearDateStr('01/01/2024!!')).toBe('01/01/2024')
        })

        it('should return an empty string for non-string inputs or empty strings', () => {
            expect(clearDateStr('')).toBe('')
            expect(clearDateStr(null)).toBe('')
            expect(clearDateStr(undefined)).toBe('')
            expect(clearDateStr(12345)).toBe('')
        })
    })

    describe('isDateStrValid', () => {
        describe('should return true for valid date strings with default formats', () => {
            it.each(validDateStrings)('%p', dateStr => {
                expect(isDateStrValid(dateStr)).toBe(true)
            })
        })

        describe('should return false for invalid date strings', () => {
            it.each(invalidDateStrings)('%p', dateStr => {
                expect(isDateStrValid(dateStr)).toBe(false)
            })
        })

        it('should handle offset dates correctly', () => {
            expect(isDateStrValid('2024-01-01T00:00:00+00:00', ['YYYY-MM-DDTHH:mm:ssZZ'])).toBe(true)
            expect(isDateStrValid('2024-01-01T00:00:00+5000', ['YYYY-MM-DDTHH:mm:ssZ'])).toBe(true)
        })

        it('should allow custom formats', () => {
            const customFormat = 'MM/YYYY'
            expect(isDateStrValid('01/2024', [customFormat])).toBe(true)
            expect(isDateStrValid('13/2024', [customFormat])).toBe(false)
        })
    })

    describe('tryToISO', () => {
        it('should return ISO string for valid date strings', () => {
            expect(tryToISO('2024-01-01T00:00:00.000Z')).toBe('2024-01-01T00:00:00.000Z')
            expect(tryToISO('2024-01-01')).toBe(dayjs('2024-01-01T00:00:00').toISOString()) // Default to UTC start
        })

        describe('should return undefined for invalid date strings', () => {
            const invalidDatesOrNotForFormat = [
                ['[]'],
                ['2024-01-01'],
            ]
            it.each(invalidDatesOrNotForFormat)('%p', dateStr => {
                expect(tryToISO(dateStr, ['DD-MM-YYYY'])).toBeUndefined()
            })
        })

        it('should allow custom date formats', () => {
            const customFormats = ['MM/YYYY', 'YYYY/MM/DD']
            expect(tryToISO('01/2024', customFormats)).toBe(dayjs('2024-01-01T00:00:00').toISOString())
            expect(tryToISO('2024/01/01', customFormats)).toBe(dayjs('2024-01-01T00:00:00').toISOString())
        })

        describe('should work with multiple utc formats', () => {
            const utcFormats = ['YYYY-MM-DDTHH:mm:ss.SSS[Z]', 'YYYY-MM-DD[Z]']
            const cases = [
                ['2024-01-02Z', dayjs.utc('2024-01-02Z', 'YYYY-MM-DD[Z]').toISOString()],
                ['2024-01-02T11:00:00.111Z', dayjs.utc('2024-01-02T11:00:00.111Z', 'YYYY-MM-DDTHH:mm:ss.SSS[Z]').toISOString()],
            ]
            it.each(cases)('%p', (date, expectedDate) => {
                expect(tryToISO(date, utcFormats)).toBe(expectedDate)
            })
        })
    })

})
