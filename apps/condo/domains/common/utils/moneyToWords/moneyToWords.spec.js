const { moneyToWords } = require('./moneyToWords')

describe('Tests moneyToWords', () => {
    const unsupportedLocale = 'fr'
    const unsupportedCurrencyCode = 'BTC'

    test(`moneyToWords called with not supported ${unsupportedLocale} locale`, () => {
        expect(() => moneyToWords(1, { locale: unsupportedLocale })).toThrow(/Supported only /)
    })

    test(`moneyToWords called with not supported ${unsupportedCurrencyCode} currencyCode`, () => {
        expect(() => moneyToWords(1, { currencyCode: unsupportedCurrencyCode })).toThrow(/Supported only /)
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

    const testInvalidDecimialInputs = [
        '124.124',
        '124.000',
        '124.29102480918209480129',
        '0.000',
        '0.1241',
        '-0.00000',
        '-0.513511',
    ]

    const testValidInputs = [
        0,
        '0',
        -124124,
        '-124.12',
        '123',
        '123.43',
        '124.99',
        12541,
        1245.11,
        '0.40',
        '-0.40',
        0.40,
        -0.40,
        '0.1',
        '0.9',
        '0.0',
        '-0.0',
    ]

    test.each(testInvalidInputs)('Input %s', (input) => {
        expect(() => moneyToWords(input)).toThrow(/Invalid Number/)
    })

    test.each(testInvalidDecimialInputs)('Input %s', (input) => {
        expect(() => moneyToWords(input)).toThrow(/Decimal part must be two digits, but his/)
    })

    test.each(testValidInputs)('Input %s', (input) => {
        expect(() => moneyToWords(input)).not.toThrow()
    })

})