import { paymentOrderNumbersFilter, paymentPeriodFilter } from './usePaymentsFilesTableFilters'


describe('paymentPeriodFilter', () => {
    it('should find payment registries whose periods intersect the selected range', () => {
        expect(paymentPeriodFilter(['2026-10-17', '2026-10-19'])).toStrictEqual({
            AND: [
                { paymentPeriodEndDay_gte: '2026-10-17' },
                { paymentPeriodStartDate_lte: '2026-10-19' },
            ],
        })
    })

    it('should be undefined for an invalid range', () => {
        expect(paymentPeriodFilter(['invalid', '2026-10-19'])).toBeUndefined()
        expect(paymentPeriodFilter(['2026-10-17'])).toBeUndefined()
        expect(paymentPeriodFilter(['2026-02-30', '2026-03-05'])).toBeUndefined()
    })

    it('should match no payment registries for a reversed range', () => {
        expect(paymentPeriodFilter(['2026-10-19', '2026-10-17'])).toStrictEqual({
            paymentPeriodStartDate_gt: '2026-10-19',
            paymentPeriodStartDate_lt: '2026-10-17',
        })
    })
})

describe('paymentOrderNumbersFilter', () => {
    it('should filter by multiple payment order numbers', () => {
        expect(paymentOrderNumbersFilter(['123', '456'])).toStrictEqual({
            paymentOrder_in: ['123', '456'],
        })
    })
})
