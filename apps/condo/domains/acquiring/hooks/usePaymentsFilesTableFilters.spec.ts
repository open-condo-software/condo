import { paymentPeriodFilter } from './usePaymentsFilesTableFilters'


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
    })
})
