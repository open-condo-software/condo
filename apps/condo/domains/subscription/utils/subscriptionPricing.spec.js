/**
 * @jest-environment node
 */

const {
    getPriceForPeriod,
    isCustomPrice,
    getAmount,
    formatAmount,
    getDiscount,
    getMaxDiscountPercent,
} = require('./subscriptionPricing')

const yearPrice = (price) => ({ id: 'year-rule', name: 'Year', period: 'year', price, currencyCode: 'RUB' })
const monthPrice = (price) => ({ id: 'month-rule', name: 'Month', period: 'month', price, currencyCode: 'RUB' })

describe('subscriptionPricing', () => {
    describe('getPriceForPeriod', () => {
        it('picks the rule matching the period', () => {
            const prices = [monthPrice('100'), yearPrice('1000')]
            expect(getPriceForPeriod(prices, 'year').id).toBe('year-rule')
            expect(getPriceForPeriod(prices, 'month').id).toBe('month-rule')
        })

        it('returns null when the plan is not sold for that period', () => {
            expect(getPriceForPeriod([monthPrice('100')], 'year')).toBeNull()
        })
    })

    describe('isCustomPrice', () => {
        it('treats an empty price as requiring a manual offer', () => {
            expect(isCustomPrice(yearPrice(null))).toBe(true)
            expect(isCustomPrice(undefined)).toBe(true)
            expect(isCustomPrice(yearPrice('1000'))).toBe(false)
        })

        it('does not treat a zero price as custom', () => {
            expect(isCustomPrice(yearPrice('0'))).toBe(false)
            expect(getAmount(yearPrice('0'))).toBe(0)
        })
    })

    describe('formatAmount', () => {
        it('groups thousands with spaces and appends the currency symbol', () => {
            // ru groups with a non-breaking space, which is what keeps "15 300 ₽" on one line
            expect(formatAmount(15300, 'RUB', 'ru')).toBe('15 300 ₽')
        })

        it('falls back to the currency code when there is no symbol for it', () => {
            // thousands are spaced in every locale, so prices read the same across the page
            expect(formatAmount(1000, 'XYZ', 'en')).toBe('1 000 XYZ')
        })

        it('renders nothing for a missing amount', () => {
            expect(formatAmount(null, 'RUB', 'ru')).toBe('')
            expect(formatAmount(undefined, 'RUB', 'ru')).toBe('')
        })
    })

    describe('getDiscount', () => {
        it('measures the yearly price against paying month by month', () => {
            const prices = [monthPrice('1466'), yearPrice('15300')]
            const discount = getDiscount(prices, 'year')

            expect(discount).toEqual({
                fullAmount: 17592,
                amount: 15300,
                discountAmount: 2292,
                discountPercent: 13,
            })
        })

        it('gives monthly prices no discount, since there is nothing to compare against', () => {
            expect(getDiscount([monthPrice('1466'), yearPrice('15300')], 'month')).toBeNull()
        })

        it('returns null when the yearly price is not actually cheaper', () => {
            expect(getDiscount([monthPrice('1000'), yearPrice('12000')], 'year')).toBeNull()
            expect(getDiscount([monthPrice('1000'), yearPrice('13000')], 'year')).toBeNull()
        })

        it('returns null when either period is missing or priced on request', () => {
            expect(getDiscount([yearPrice('15300')], 'year')).toBeNull()
            expect(getDiscount([monthPrice(null), yearPrice('15300')], 'year')).toBeNull()
        })

        it('refuses to subtract prices in different currencies', () => {
            const usdMonth = { ...monthPrice('100'), currencyCode: 'USD' }
            expect(getDiscount([usdMonth, yearPrice('1000')], 'year')).toBeNull()
        })
    })

    describe('getMaxDiscountPercent', () => {
        it('advertises the best saving any single plan actually gives', () => {
            const cheap = [monthPrice('100'), yearPrice('1080')] // 10%
            const better = [monthPrice('100'), yearPrice('960')] // 20%

            expect(getMaxDiscountPercent([cheap, better])).toBe(20)
        })

        it('returns null when nothing is discounted', () => {
            expect(getMaxDiscountPercent([[monthPrice('100'), yearPrice('1200')]])).toBeNull()
            expect(getMaxDiscountPercent([])).toBeNull()
        })
    })
})
