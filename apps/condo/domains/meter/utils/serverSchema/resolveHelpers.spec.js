const dayjs = require('dayjs')

const { isReadingDateAllowed } = require('./resolveHelpers')

describe('isReadingDateAllowed', () => {
    const meterReportingPeriod = {
        notifyStartDay: 1,
        notifyEndDay: 10,
        restrictionEndDay: 20,
        isStrict: true,
    }

    test('should allow reading date within notify period', () => {
        const date = dayjs().date(5).toISOString()
        expect(isReadingDateAllowed(date, meterReportingPeriod)).toBe(true)
    })

    test('should reject reading date after notify period but before restriction end', () => {
        const date = dayjs().date(15).toISOString()
        expect(isReadingDateAllowed(date, meterReportingPeriod)).toBe(false)
    })

    test('should allow reading date after notify period end but before new period', () => {
        const date = dayjs().date(25).toISOString()
        expect(isReadingDateAllowed(date, meterReportingPeriod)).toBe(true)
    })

    test('should allow reading date if period is not strict', () => {
        const nonStrictPeriod = { ...meterReportingPeriod, isStrict: false }
        const date = dayjs().date(25).toISOString()
        expect(isReadingDateAllowed(date, nonStrictPeriod)).toBe(true)
    })

    test('should handle restriction period spanning two months', () => {
        const spanningPeriod = { ...meterReportingPeriod, notifyStartDay: 25, notifyEndDay: 5 }
        const date = dayjs().date(28).toISOString()
        expect(isReadingDateAllowed(date, spanningPeriod)).toBe(true)
    })

    test('should handle restriction period spanning two months and date in previous month', () => {
        const spanningPeriod = { ...meterReportingPeriod, notifyStartDay: 25, notifyEndDay: 5 }
        const date = dayjs().subtract(1, 'month').date(28).toISOString()
        expect(isReadingDateAllowed(date, spanningPeriod)).toBe(true)
    })

    test('should not allow reading date if restriction period spans two months and date is outside allowed period', () => {
        const spanningPeriod = { ...meterReportingPeriod, notifyStartDay: 25, notifyEndDay: 5 }
        const date = dayjs().date(10).toISOString()
        expect(isReadingDateAllowed(date, spanningPeriod)).toBe(false)
    })
})