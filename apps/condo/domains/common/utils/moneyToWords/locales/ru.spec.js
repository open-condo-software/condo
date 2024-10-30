
const { cloneDeep } = require('lodash')

const { moneyToWords } = require('../index')

const locale = 'ru'
const currencyCode = 'RUB'

const testIntegers = [
    [0, 'Ноль'],
    [137, 'Сто тридцать семь'],
    [700, 'Семьсот'],
    [1100, 'Одна тысяча сто'],
    [4680, 'Четыре тысячи шестьсот восемьдесят'],
    [63892, 'Шестьдесят три тысячи восемьсот девяносто два'],
    [86100, 'Восемьдесят шесть тысяч сто'],
    [792581, 'Семьсот девяносто две тысячи пятьсот восемьдесят один'],
    [2741034, 'Два миллиона семьсот сорок одна тысяча тридцать четыре'],
    [86429753, 'Восемьдесят шесть миллионов четыреста двадцать девять тысяч семьсот пятьдесят три'],
]

describe('Test Integers with optioins = { format: `$WholeString` }', () => {
    test.concurrent.each(testIntegers)('moneyToWords %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$WholeString' })).toBe(expected)
    })
})

describe('Test Negative Integers with optioins = { format: `$WholeString` }', () => {
    const testNegativeIntegers = cloneDeep(testIntegers)
    testNegativeIntegers.map((row, i) => {
        if (i === 0) {
            return
        }
        row[0] = -row[0]
    })

    test.concurrent.each(testNegativeIntegers)('moneyToWords %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$WholeString' })).toBe(expected)
    })
})

const testIntegersWithCurrency = [
    [0, 'Ноль рублей'],
    [137, 'Сто тридцать семь рублей'],
    [700, 'Семьсот рублей'],
    [1100, 'Одна тысяча сто рублей'],
    [4680, 'Четыре тысячи шестьсот восемьдесят рублей'],
    [63892, 'Шестьдесят три тысячи восемьсот девяносто два рубля'],
    [86100, 'Восемьдесят шесть тысяч сто рублей'],
    [792581, 'Семьсот девяносто две тысячи пятьсот восемьдесят один рубль'],
    [2741034, 'Два миллиона семьсот сорок одна тысяча тридцать четыре рубля'],
    [86429753, 'Восемьдесят шесть миллионов четыреста двадцать девять тысяч семьсот пятьдесят три рубля'],
]

describe('Test Integers with optioins = { format: `$WholeString $wholeCurrency` }', () => {
    test.concurrent.each(testIntegersWithCurrency)('moneyToWords %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$WholeString $wholeCurrency' })).toBe(expected)
    })
})

const testFloatsWithCurrency = [
    [0.0, 'Ноль рублей ноль копеек'],
    [0.04, 'Ноль рублей четыре копейки'],
    [0.0468, 'Ноль рублей четыре копейки'],
    [0.4, 'Ноль рублей сорок копеек'],
    [0.63, 'Ноль рублей шестьдесят три копейки'],
    [0.973, 'Ноль рублей девяносто семь копеек'],
    [0.999, 'Ноль рублей девяносто девять копеек'],
    [37.01, 'Тридцать семь рублей одна копейка'],
    [37.068, 'Тридцать семь рублей шесть копеек'],
    [37.68, 'Тридцать семь рублей шестьдесят восемь копеек'],
    [37.683, 'Тридцать семь рублей шестьдесят восемь копеек'],
]

describe('Test Floats with optioins = { currencyCode, format: `$WholeString $wholeCurrency $decimalString $decimalCurrency` }', () => {
    test.concurrent.each(testFloatsWithCurrency)('moneyToWords %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$WholeString $wholeCurrency $decimalString $decimalCurrency' })).toBe(expected)
    })
})
