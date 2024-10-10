const { clearDateStr, isDateStrValid } = require('@condo/domains/meter/utils/meterDate.utils')


describe('meterDateUtils', () => {

    describe('clearDateStr', () => {

        it('should return sanitized date string if input contains extraneous characters', () => {
            const input = '2021-05-04T12:34:56Z!!!'
            const output = '2021-05-04T12:34:56Z'
            expect(clearDateStr(input)).toBe(output)
        })

        it('should return empty string for empty string', () => {
            const input = ''
            expect(clearDateStr(input)).toBe('')
        })

        it('should return empty string for null input', () => {
            expect(clearDateStr(null)).toBe('')
        })

        it('should return empty string for undefined input', () => {
            expect(clearDateStr(undefined)).toBe('')
        })

        it('should return empty string for non-string input (number)', () => {
            const input = 12345
            expect(clearDateStr(input)).toBe('')
        })

        it('should return empty string for non-string input (object)', () => {
            const input = { date: '2021-05-04' }
            expect(clearDateStr(input)).toBe('')
        })

        it('should return empty string for a string with only invalid characters', () => {
            const input = '!!!@#@#$$%'
            expect(clearDateStr(input)).toBe('')
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
        it('should return true for valid ISO date-time string with Z', () => {
            expect(isDateStrValid('2024-06-17T18:44:13.539Z')).toBe(true)
        })

        it('should return true for valid ISO date-time string with timezone +08:00', () => {
            expect(isDateStrValid('2024-06-17T18:44:13.539+08:00')).toBe(true)
        })

        it('should return true for valid date string YYYY-MM-DD HH:mm:ss', () => {
            expect(isDateStrValid('2024-06-17 18:44:13')).toBe( true)
        })

        it('should return true for valid date string with European format DD.MM.YYYY HH:mm', () => {
            expect(isDateStrValid('17.06.2024 18:44')).toBe( true)
        })

        it('should return true for valid date string with MM/YYYY format', () => {
            expect(isDateStrValid('06/2024')).toBe( true)
        })

        it('should return true for valid date string with no time component (YYYY-MM-DD)', () => {
            expect(isDateStrValid('2024-06-17')).toBe( true)
        })

        it('should return true for valid date with special offset +05:45', () => {
            expect(isDateStrValid('2024-06-17T18:44:13.539+05:45')).toBe( true)
        })

        // Test invalid date strings
        it('should return false for invalid date string with wrong format', () => {
            expect(isDateStrValid('invalid-date-string')).toBe( false)
        })

        it('should return false for date string with invalid hour', () => {
            expect(isDateStrValid('2024-06-17T25:44:13.539Z')).toBe( false)
        })

        it('should return true for date string with out-of-range timezone offset +15:00', () => {
            expect(isDateStrValid('2024-06-17T18:44:13.539+15:00')).toBe( true)
        })

        it('should return false for date string with unsupported format (random string)', () => {
            expect(isDateStrValid('2024-06-17 random text')).toBe( false)
        })

        // Test valid date formats (without time component)
        it('should return true for valid European date format DD-MM-YYYY', () => {
            expect(isDateStrValid('17-06-2024')).toBe( true)
        })

        it('should return false for date-only string in unsupported format (DD/YYYY/MM)', () => {
            expect(isDateStrValid('17/2024/06')).toBe( false)
        })

        // Test cases with missing time or date components
        it('should return false for date string with only time component', () => {
            expect(isDateStrValid('18:44:13')).toBe( false)
        })

        it('should return false for missing time in date-time string', () => {
            expect(isDateStrValid('2024-06-17T')).toBe( false)
        })
    })
})