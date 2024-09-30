import { clearDateStr, isDateStrValid } from '@condo/domains/common/utils/date'

import { getMonthStart, getStartDates } from './date'

describe('Date helper tests', () => {
    describe('getMonthStart', () => {
        it('returns properly formatted correct date value', () => {
            const thisMonthStart = new Date().toISOString().slice(0, 7) + '-01'

            expect(getMonthStart('2022-04-18', true)).toStrictEqual('2022-04-01')
            expect(getMonthStart(undefined, true)).toStrictEqual(thisMonthStart)
        })
    })

    describe('getStartDates', () => {
        it('returns properly formatted correct date values for prev, current and next month start', () => {
            const { prevMonthStart, thisMonthStart, nextMonthStart } = getStartDates('2022-05-17')

            expect(prevMonthStart).toStrictEqual('2022-04-01')
            expect(thisMonthStart).toStrictEqual('2022-05-01')
            expect(nextMonthStart).toStrictEqual('2022-06-01')
        })

        it('returns properly formatted correct date values for prev, current and next month start for december', () => {
            const { prevMonthStart, thisMonthStart, nextMonthStart } = getStartDates('2022-12-17')

            expect(prevMonthStart).toStrictEqual('2022-11-01')
            expect(thisMonthStart).toStrictEqual('2022-12-01')
            expect(nextMonthStart).toStrictEqual('2023-01-01')
        })

        it('returns properly formatted correct date values for prev, current and next month start for january', () => {
            const { prevMonthStart, thisMonthStart, nextMonthStart } = getStartDates('2022-01-17')

            expect(prevMonthStart).toStrictEqual('2021-12-01')
            expect(thisMonthStart).toStrictEqual('2022-01-01')
            expect(nextMonthStart).toStrictEqual('2022-02-01')
        })
    })

    describe('clearDateStr', () => {

        it('should return sanitized date string if input contains extraneous characters', () => {
            const input = '2021-05-04T12:34:56Z!!!'
            const output = '2021-05-04T12:34:56Z'
            expect(clearDateStr(input)).toBe(output)
        })

        it('should return null for empty string', () => {
            const input = ''
            expect(clearDateStr(input)).toBeNull()
        })

        it('should return null for null input', () => {
            expect(clearDateStr(null)).toBeNull()
        })

        it('should return null for undefined input', () => {
            expect(clearDateStr(undefined)).toBeNull()
        })

        it('should return null for non-string input (number)', () => {
            const input = 12345
            expect(clearDateStr(input)).toBeNull()
        })

        it('should return null for non-string input (object)', () => {
            const input = { date: '2021-05-04' }
            expect(clearDateStr(input)).toBeNull()
        })

        it('should return null for a string with only invalid characters', () => {
            const input = '!!!@#@#$$%'
            expect(clearDateStr(input)).toBeNull()
        })

        it('should return unchanged date string if no extraneous characters', () => {
            const input = '2021-05-04T12:34:56Z'
            const output = '2021-05-04T12:34:56Z'
            expect(clearDateStr(input)).toBe(output)
        })

        it('should trim whitespace and return valid date string', () => {
            const input = '   2021-05-04T12:34:56Z   '
            const output = '2021-05-04T12:34:56Z'
            expect(clearDateStr(input)).toBe(output)
        })

    })

    describe('isDateStrValid', () => {
        it('should return true for valid date string with default options', () => {
            const input = '2023-09-30'
            expect(isDateStrValid(input, {})).toBe(true)
        })

        it('should return false for invalid date string with default options', () => {
            const input = 'InvalidDate'
            expect(isDateStrValid(input, {})).toBe(false)
        })

        it('should return true for valid date string with specific format', () => {
            const input = '30/09/2023'
            const options = { formats: ['DD/MM/YYYY'] }
            expect(isDateStrValid(input, options)).toBe(true)
        })

        it('should return false for valid date with incorrect format in strict mode', () => {
            const input = '30/09/2023'
            const options = { formats: ['YYYY-MM-DD'], strict: true }
            expect(isDateStrValid(input, options)).toBe(false)
        })

        it('should return true for valid date with correct format in strict mode', () => {
            const input = '2023-09-30'
            const options = { formats: ['YYYY-MM-DD'], strict: true }
            expect(isDateStrValid(input, options)).toBe(true)
        })

        it('should return false for invalid date string in strict mode', () => {
            const input = '30/09/2023'
            const options = { formats: ['YYYY-MM-DD'], strict: true }
            expect(isDateStrValid(input, options)).toBe(false)
        })

        it('should return true for valid date string when format is provided but strict mode is off', () => {
            const input = '30/09/2023'
            const options = { formats: ['DD/MM/YYYY'], strict: false }
            expect(isDateStrValid(input, options)).toBe(true)
        })

        it('should return false for invalid date string when no format is provided', () => {
            const input = '99/99/9999'
            const options = {}
            expect(isDateStrValid(input, options)).toBe(false)
        })

        it('should return false for empty string input', () => {
            const input = ''
            expect(isDateStrValid(input, {})).toBe(false)
        })

        it('should return false for null input', () => {
            expect(isDateStrValid(null, {})).toBe(false)
        })

        it('should return true for valid date without specifying options', () => {
            const input = '2023-09-30'
            expect(isDateStrValid(input)).toBe(true)
        })
    })
})
