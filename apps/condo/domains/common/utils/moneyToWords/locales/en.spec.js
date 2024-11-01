
const { cloneDeep } = require('lodash')

const { moneyToWords } = require('../index')

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

const testNegativeIntegers = cloneDeep(testIntegers)
testNegativeIntegers.map((row, i) => {
    if (i === 0) {
        return
    }
    row[0] = -row[0]
})

const testIntegersWithCurrency = cloneDeep(testIntegers)
testIntegersWithCurrency.map((row) => {
    row[1] = `${row[1]} dollars`
})


const testFloats = [
    [0.0, 'Zero zero'],
    [0.04, 'Zero four'],
    [0.0468, 'Zero five'],
    [0.4, 'Zero forty'],
    [0.63, 'Zero sixty three'],
    [0.973, 'Zero ninety seven'],
    [0.999, 'One zero'],
    [37.06, 'Thirty seven six'],
    [37.068, 'Thirty seven seven'],
    [37.68, 'Thirty seven sixty eight'],
    [37.683, 'Thirty seven sixty eight'],
]

const testFloatsWithCurrency = [
    [0.0, 'Zero dollars zero cents'],
    [0.04, 'Zero dollars four cents'],
    [0.0468, 'Zero dollars five cents'],
    [0.4, 'Zero dollars forty cents'],
    [0.63, 'Zero dollars sixty three cents'],
    [0.973, 'Zero dollars ninety seven cents'],
    [0.999, 'One dollars zero cents'],
    [37.06, 'Thirty seven dollars six cents'],
    [37.068, 'Thirty seven dollars seven cents'],
    [37.68, 'Thirty seven dollars sixty eight cents'],
    [37.683, 'Thirty seven dollars sixty eight cents'],
]


describe('Test "en" locale moneyToWords', () => {
    test.concurrent.each(testIntegers)('moneyToWords(testIntegers) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$wholeString' })).toBe(expected)
    })

    test.concurrent.each(testNegativeIntegers)('moneyToWords(testNegativeIntegers) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$wholeString' })).toBe(expected)
    })

    test.concurrent.each(testIntegersWithCurrency)('moneyToWords(testIntegersWithCurrency) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$wholeString $wholeCurrency' })).toBe(expected)
    })

    test.concurrent.each(testFloats)('moneyToWords(testFloats) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$WholeString $decimalString' })).toBe(expected)
    })
    
    test.concurrent.each(testFloatsWithCurrency)('moneyToWords(testFloatsWithCurrency) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$WholeString $wholeCurrency $decimalString $decimalCurrency' })).toBe(expected)
    })
})