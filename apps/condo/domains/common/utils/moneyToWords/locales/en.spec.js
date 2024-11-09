const { moneyToWords } = require('../moneyToWords')

const locale = 'en'
const currencyCode = 'USD'

const testIntegers = [
    [0, 'zero'],
    [51, 'fifty one'],
    [137, 'one hundred thirty seven'],
    [700, 'seven hundred'],
    [1100, 'one thousand one hundred'],
    [4680, 'four thousand six hundred eighty'],
    [63892, 'sixty three thousand eight hundred ninety two'],
    [86100, 'eighty six thousand one hundred'],
    [792581, 'seven hundred ninety two thousand five hundred eighty one'],
    [2741034, 'two million seven hundred forty one thousand thirty four'],
    [86429753, 'eighty six million four hundred twenty nine thousand seven hundred fifty three'],
]

const testNegativeIntegers = testIntegers.map((row, i) => {
    if (i === 0) {
        return [row[0], 'Zero']
    }
    return [-row[0], `Minus ${row[1]}`]
})

const testIntegersWithCurrency = testIntegers.map((row) => {
    return [row[0], `${row[1]} dollars`]
})

const testFloatsWithFirstUpper = [
    [0.0, 'Zero zero'],
    [0.04, 'Zero four'],
    ['0.40', 'Zero forty'],
    [0.63, 'Zero sixty three'],
    [37.06, 'Thirty seven six'],
    [37.68, 'Thirty seven sixty eight'],
]

const testFloatsWithCurrencyAndFirstUpper = [
    [0.00, 'Zero dollars zero cents'],
    [0.04, 'Zero dollars four cents'],
    ['0.40', 'Zero dollars forty cents'],
    [0.63, 'Zero dollars sixty three cents'],
    [37.06, 'Thirty seven dollars six cents'],
    [37.68, 'Thirty seven dollars sixty eight cents'],
]


describe('Test "en" locale moneyToWords', () => {
    test.each(testIntegers)('moneyToWords(testIntegers) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$wholeString' })).toBe(expected)
    })

    test.each(testNegativeIntegers)('moneyToWords(testNegativeIntegers) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$WholeString' })).toBe(expected)
    })

    test.each(testIntegersWithCurrency)('moneyToWords(testIntegersWithCurrency) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$wholeString $wholeCurrency' })).toBe(expected)
    })

    test.each(testFloatsWithFirstUpper)('moneyToWords(testFloatsWithFirstUpper) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$WholeString $decimalString' })).toBe(expected)
    })
    
    test.each(testFloatsWithCurrencyAndFirstUpper)('moneyToWords(testFloatsWithCurrencyAndFirstUpper) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$WholeString $wholeCurrency $decimalString $decimalCurrency' })).toBe(expected)
    })
})