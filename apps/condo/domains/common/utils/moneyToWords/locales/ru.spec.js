const { moneyToWords } = require('../moneyToWords')

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

const testNegativeIntegers = testIntegers.map((row, i) => {
    if (i === 0) {
        return [row[0], 'Ноль' ]
    }
    return [-row[0], `Минус ${row[1]}`]
})

const testIntegersWithCurrencyAndFirstUpper = [
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

const testFloatsWithCurrencyAndFirstUpper = [
    [0.0, 'Ноль рублей ноль копеек'],
    [0.04, 'Ноль рублей четыре копейки'],
    ['0.40', 'Ноль рублей сорок копеек'],
    [0.63, 'Ноль рублей шестьдесят три копейки'],
    [37.01, 'Тридцать семь рублей одна копейка'],
    [37.68, 'Тридцать семь рублей шестьдесят восемь копеек'],
]


describe('Test "ru" locale moneyToWords', () => {
    test.each(testIntegers)('moneyToWords(testIntegers) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$wholeString' })).toBe(expected)
    })

    test.each(testNegativeIntegers)('moneyToWords(testNegativeIntegers) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$WholeString' })).toBe(expected)
    })

    test.each(testIntegersWithCurrencyAndFirstUpper)('moneyToWords(testIntegersWithCurrencyAndFirstUpper) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$WholeString $wholeCurrency' })).toBe(expected)
    })

    test.each(testFloatsWithCurrencyAndFirstUpper)('moneyToWords(testFloatsWithCurrencyAndFirstUpper) %d => %s', (input, expected) => {
        expect(moneyToWords(input, { locale, currencyCode, format: '$WholeString $wholeCurrency $decimalString $decimalCurrency' })).toBe(expected)
    })
})
