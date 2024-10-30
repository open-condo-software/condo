
const { cloneDeep } = require('lodash')

const { moneyToWords } = require('../index')

const locale = 'en'
const currencyCode = 'USD'

const testIntegers = [
    [0, 'Zero'],
    [137, 'One hundred thirty seven'],
    [700, 'Seven hundred'],
    [1100, 'One thousand one hundred'],
    [4680, 'Four thousand six hundred eighty'],
    [63892, 'Sixty three thousand eight hundred ninety two'],
    [86100, 'Eighty six thousand one hundred'],
    [792581, 'Seven hundred ninety two thousand five hundred eighty one'],
    [2741034, 'Two million seven hundred forty one thousand thirty four'],
    [86429753, 'Eighty six million four hundred twenty nine thousand seven hundred fifty three'],
]

describe(`Test Integers with optioins = { format: '$WholeString' }`, () => {
    test.concurrent.each(testIntegers)('moneyToWords %d => %s', (input, expected) => {
        expect(moneyToWords(input, {locale, currencyCode, format: '$WholeString'})).toBe(expected)
    })
})

describe(`Test Negative Integers with optioins = { format: '$WholeString' }`, () => {
    const testNegativeIntegers = cloneDeep(testIntegers)
    testNegativeIntegers.map((row, i) => {
        if (i === 0) {
            return
        }
        row[0] = -row[0]
    })

    test.concurrent.each(testNegativeIntegers)('moneyToWords %d => %s', (input, expected) => {
        expect(moneyToWords(input, {locale, currencyCode, format: '$WholeString'})).toBe(expected)
    })
})

describe(`Test Integers with optioins = { format: '$WholeString $wholeCurrency' }`, () => {
    const testIntegersWithCurrency = cloneDeep(testIntegers)
    testIntegersWithCurrency.map((row) => {
        row[1] = `${row[1]} dollars`
    })

    test.concurrent.each(testIntegersWithCurrency)('moneyToWords %d => %s', (input, expected) => {
        expect(moneyToWords(input, {locale, currencyCode, format: '$WholeString $wholeCurrency'})).toBe(expected)
    })
})


const testFloats = [
    [0.0, 'Zero zero'],
    [0.04, 'Zero four'],
    [0.0468, 'Zero four'],
    [0.4, 'Zero forty'],
    [0.63, 'Zero sixty three'],
    [0.973, 'Zero ninety seven'],
    [0.999, 'Zero ninety nine'],
    [37.06, 'Thirty seven six'],
    [37.068, 'Thirty seven six'],
    [37.68, 'Thirty seven sixty eight'],
    [37.683, 'Thirty seven sixty eight'],
]

describe(`Test Floats with optioins = { format: '$WholeString $decimalString' }`, () => {
    test.concurrent.each(testFloats)('moneyToWords %d => %s', (input, expected) => {
        expect(moneyToWords(input, {locale, currencyCode, format: '$WholeString $decimalString'})).toBe(expected)
    })
})

const testFloatsWithCurrency = [
    [0.0, `Zero dollars zero cents`],
    [0.04, `Zero dollars four cents`],
    [0.0468, `Zero dollars four cents`],
    [0.4, `Zero dollars forty cents`],
    [0.63, `Zero dollars sixty three cents`],
    [0.973, `Zero dollars ninety seven cents`],
    [0.999, `Zero dollars ninety nine cents`],
    [37.06, `Thirty seven dollars six cents`],
    [37.068, `Thirty seven dollars six cents`],
    [37.68, `Thirty seven dollars sixty eight cents`],
    [37.683, `Thirty seven dollars sixty eight cents`],
]

describe(`Test Floats with optioins = { currencyCode, format: '$WholeString $wholeCurrency $decimalString $decimalCurrency' }`, () => {
    test.concurrent.each(testFloatsWithCurrency)('moneyToWords %d => %s', (input, expected) => {
        expect(moneyToWords(input, {locale, currencyCode, format: '$WholeString $wholeCurrency $decimalString $decimalCurrency'})).toBe(expected)
    })
})
