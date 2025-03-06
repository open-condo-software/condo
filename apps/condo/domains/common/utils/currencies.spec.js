const { getCurrencyDecimalPlaces } = require('./currencies')
describe('Count fraction length (number of decimal places) correctly', () => {
    const cases = [
        // [locale, currency, expectedResult]
        ['en', 'USD', 2],
        ['es', 'EUR', 2],
        ['ru', 'RUB', 2],
        ['en', 'BHD', 3], // Bahraini Dinar
        ['en', 'GNF', 0], // Guinea Franc
        ['oh', 'my', 2], // wrong locale and currency
        ['en', 'oops', 2], // wrong currency
        ['oops', 'USD', 2], // wrong locale
    ]

    test.each(cases)('for %p and %p must be %p', (locale, currencyCode, expectedDecimalPlaces) => {
        expect(getCurrencyDecimalPlaces(locale, currencyCode)).toBe(expectedDecimalPlaces)
    })
})
