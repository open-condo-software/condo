
const { cloneDeep } = require('lodash')

const { moneyToWords } = require('../index')

const locale = 'ru'
const currencyCode = 'RUB'

const testIntegers = [
    [0, 'ноль'],
    [51, 'пятьдесят один'],
    [137, 'сто тридцать семь'],
    [700, 'семьсот'],
    [1100, 'одна тысяча сто'],
    [4680, 'четыре тысячи шестьсот восемьдесят'],
    [63892, 'шестьдесят три тысячи восемьсот девяносто два'],
    [86100, 'восемьдесят шесть тысяч сто'],
    [792581, 'семьсот девяносто две тысячи пятьсот восемьдесят один'],
    [2741034, 'два миллиона семьсот сорок одна тысяча тридцать четыре'],
    [86429753, 'восемьдесят шесть миллионов четыреста двадцать девять тысяч семьсот пятьдесят три'],
]

const testNegativeIntegers = cloneDeep(testIntegers)
testNegativeIntegers.map((row, i) => {
    if (i === 0) {
        return
    }
    row[0] = -row[0]
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

const testFloatsWithCurrency = [
    [0.0, 'Ноль рублей ноль копеек'],
    [0.04, 'Ноль рублей четыре копейки'],
    [0.0468, 'Ноль рублей пять копеек'],
    [0.4, 'Ноль рублей сорок копеек'],
    [0.63, 'Ноль рублей шестьдесят три копейки'],
    [0.973, 'Ноль рублей девяносто семь копеек'],
    [0.999, 'Один рубль ноль копеек'],
    [37.01, 'Тридцать семь рублей одна копейка'],
    [37.068, 'Тридцать семь рублей семь копеек'],
    [37.68, 'Тридцать семь рублей шестьдесят восемь копеек'],
    [37.683, 'Тридцать семь рублей шестьдесят восемь копеек'],
]


describe('Test "ru" locale moneyToWords', () => {
    test.concurrent.each(testIntegers)('moneyToWords(testIntegers) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$wholeString' })).toBe(expected)
    })

    test.concurrent.each(testNegativeIntegers)('moneyToWords(testNegativeIntegers) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$wholeString' })).toBe(expected)
    })

    test.concurrent.each(testIntegersWithCurrency)('moneyToWords(testIntegersWithCurrency) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$WholeString $wholeCurrency' })).toBe(expected)
    })

    test.concurrent.each(testFloatsWithCurrency)('moneyToWords(testFloatsWithCurrency) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$WholeString $wholeCurrency $decimalString $decimalCurrency' })).toBe(expected)
    })
})
