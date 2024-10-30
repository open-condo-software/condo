const { moneyToWords } = require('.')

describe('Wrong Locale', () => {
    const locale = 'fr-sfs'

    test(`'format' called with ${locale} locale`, () => {
        expect(() => moneyToWords(1, { locale })).toThrow(/Unknown Locale/)
    })

    const currencyCode = 'SDF'
    test(`'format' called with ${currencyCode} currencyCode`, () => {
        expect(() => moneyToWords(1, { currencyCode })).toThrow(/Unknown currencyCode/)
    })
})

describe('Test Wrong Inputs', () => {

    const testWrongInputs = [
        '',
        'sdf.asf',
        NaN,
    ]

    test.concurrent.each(testWrongInputs)('Input %s', (input) => {
        expect(() => moneyToWords(input)).toThrow(/Invalid Number/)
    })
})