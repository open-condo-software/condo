const { moneyToWords } = require('.')

describe('Tests moneyToWords', () => {
    const unsupportedLocale = 'fr'
    const unsupportedCurrencyCode = 'BTC'

    test(`moneyToWords called with not supported ${unsupportedLocale} locale`, () => {
        expect(() => moneyToWords(1, { locale: unsupportedLocale })).toThrow(/Supported only "ru" and "en" locale/)
    })

    test(`moneyToWords called with not supported ${unsupportedCurrencyCode} currencyCode`, () => {
        expect(() => moneyToWords(1, { currencyCode: unsupportedCurrencyCode })).toThrow(/Supported only "RUB" and "USD" currencyCode/)
    })

    const testInvalidInputs = [
        '',
        '      ',
        undefined,
        {},
        [],
        true,
        false,
        NaN,
        'ssdfsdfsd',
        '141,124',
        '    12345 125 1245',
        '124.sdf',
        '124_124_124.24',
        '123.124.1241.124',
        'NaN',
        '______',
        '-125-',
        '--124',
        Infinity,
        -Infinity,
    ]

    const testValidInputs = [
        0,
        '0',
        '123',
        '123.43',
        '124.43252323',
        '-124.12',
        12541,
        1245.124,
        -124124,
    ]

    test.concurrent.each(testInvalidInputs)('Input %s', (input) => {
        expect(() => moneyToWords(input)).toThrow(/Invalid Number/)
    })

    test.concurrent.each(testValidInputs)('Input %s', (input) => {
        expect(() => moneyToWords(input)).not.toThrow()
    })

})