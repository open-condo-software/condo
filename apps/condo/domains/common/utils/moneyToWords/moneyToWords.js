const { capitalize } = require('lodash')

const LOCALES = require('./locales')

const FORMAT_REG_EXP = /\$([a-z]+)/gi

const DEFAULT_OPTIONS = {
    locale: 'ru',
    currencyCode: 'RUB',
    format: '$WholeString $wholeCurrency $decimalString $decimalCurrency',
}

/**
 * @exception Currently only supported - 'ru' and 'en' locale 
 * @exception Currently only supported - 'RUB' and 'USD' currencyCode 
 * 
 * @param { number | string } input - whole and decimal parts only through a dot. Example '124123.15'
 * @param {{
 *      locale: string,
 *      currencyCode: string,
 *      format: string,
 * }} options 
 * @returns { string } money converted into words
 * @default options = {
 *   locale: 'ru',
 *   currencyCode: 'RUB',
 *   format: '$WholeString $wholeCurrency $decimalString $decimalCurrency', 
 *   }
 * @description
 * options.format contains the form of the string that the function will return.
 * options.format can contain any combination of the following variables: 
 * - $wholeString, 
 * - $wholeCurrency, 
 * - $WholeString, 
 * - $WholeCurrency, 
 * - $decimalString, 
 * - $decimalCurrency, 
 * - $DecimalString, 
 * - $decimalCurrency
 * @example moneyToWords('124', oprtions = {locale: 'en', currencyCode: 'USD', format = '$WholeString $wholeCurrency'}) returns 'One hundred twenty four dollars'
 * @example moneyToWords('124.45', oprtions = {locale: 'en', currencyCode: 'USD', format = '$decimalString $decimalCurrency'}) returns 'fourty five cents'
 * @example moneyToWords('123.45', oprtions = {locale: 'en', currencyCode: 'USD', format = '$WholeString $wholeCurrency $decimalString $decimalCurrency'}) returns 'One hundred twenty four dollars fourty five cents'
 * @exception This function can work with numbers up to >10000000000. But it can be easily extended to numbers of higher orders.
 */

function moneyToWords (input, options = {}) {
    options = { ...DEFAULT_OPTIONS, ...options }

    if (!(options.locale in LOCALES)) throw new Error(`Supported only ${Object.keys(LOCALES).join(', ')} locales`)
    if (!(options.currencyCode in LOCALES[options.locale].supportedCurrencies)) throw new Error(`Supported only ${Object.keys(LOCALES[options.locale].supportedCurrencies).join(', d')} locales`)

    if (!(!isNaN(parseFloat(input)) && isFinite(input))) throw new Error(`Invalid Number "${input}"`)

    const { currency, dischargesLessThanThousand, dischargesMoreThanThousand, texts } = _setWordsToConvert(options.locale, options.currencyCode)

    const isNegativeNumber = input < 0
    if (isNegativeNumber) input = input.toString().slice(1)

    let [whole = '0', decimal = '00'] = _parseNumber(input)

    if (decimal.length === 1) decimal += '0' 

    if (decimal.length !== 2) throw new Error(`Decimal part must be two digits, but his '${decimal}'`)

    const wholeString = isNegativeNumber ? texts.minus + ' ' + _numbersInWords(input, { dischargesLessThanThousand, dischargesMoreThanThousand }) : _numbersInWords(input, { dischargesLessThanThousand, dischargesMoreThanThousand })
    const wholeCurrency = _counterWord(currency[0], +whole.slice(-2))
    const decimalString = _numbersInWords(+decimal, { dischargesLessThanThousand, dischargesMoreThanThousand }, true)
    const decimalCurrency = _counterWord(currency[1], +decimal)

    return options.format.replace(FORMAT_REG_EXP, (find, arg) => {
        switch (arg) {
            case 'wholeString': return wholeString
            case 'wholeCurrency': return wholeCurrency
            case 'WholeString': return capitalize(wholeString)
            case 'WholeCurrency': return capitalize(wholeCurrency)
            case 'decimalString': return decimalString
            case 'decimalCurrency': return decimalCurrency
            case 'DecimalString': return capitalize(decimalString)
            case 'DecimalCurrency': return capitalize(decimalCurrency)
            default: return find
        }
    })
}

function _setWordsToConvert (locale = 'ru', currencyCode = 'RUB') {
    if (!(locale in LOCALES)) throw new Error(`Unknown Locale "${locale}"`)
    const wordsToConvert = LOCALES[locale]
    if (!(currencyCode in wordsToConvert.supportedCurrencies)) throw new Error(`Unknown currencyCode "${currencyCode}"`)
    const currency = wordsToConvert.supportedCurrencies[currencyCode]
    const dischargesLessThanThousand = wordsToConvert.dischargesLessThanThousand
    const dischargesMoreThanThousand = wordsToConvert.dischargesMoreThanThousand
    const texts = wordsToConvert.texts
    return { currency, dischargesLessThanThousand, dischargesMoreThanThousand, texts }
}

function _parseNumber (input) {
    return input
        .toString()
        .replace(/\s+/g, '')
        .split(/[.]/)
}

function _numbersInWords (input, { dischargesLessThanThousand, dischargesMoreThanThousand }, firstDigitDeclension = false ) {
    // TODO: DOMA-10610 Rewrite moneyToWords for all locales
    const output = []

    let [num] = _parseNumber(input)

    let deep = 0

    if (!num || num === '0') return dischargesLessThanThousand[0][0]

    while (num.length) {
        const row = []
        const current = +num.slice(-3)
        num = num.slice(0, -3)

        const hundreds = Math.floor(current / 100)
        const dozens = Math.floor(current / 10 % 10)
        const units = current % 10

        if (current) {
            row.push(dischargesLessThanThousand[4][hundreds])

            if (dozens === 1) {
                row.push(dischargesLessThanThousand[2][units])
            } else {
                row.push(dischargesLessThanThousand[3][dozens])

                if (deep === 1 || deep == 0 && firstDigitDeclension) {
                    row.push(
                        dischargesLessThanThousand[5][units] ?? dischargesLessThanThousand[1][units] 
                    )
                } else {
                    row.push(dischargesLessThanThousand[1][units])
                }
            }

            if (deep) {
                row.push(_counterWord(dischargesMoreThanThousand[deep] ?? dischargesMoreThanThousand[0], current))
            }
        }

        const rowString = row.filter(partJoin => partJoin && partJoin !== '-').join(' ')

        if (rowString)
            output.unshift(rowString)

        deep++
    }

    return output.join(' ')
}

function _counterWord (input, counter) {
    const units = counter % 10

    if (counter > 10 && counter < 20)
        return _joinWord(input, 0)

    if (units == 1)
        return _joinWord(input, 1)

    if (units > 1 && units < 5)
        return _joinWord(input, 2)

    return _joinWord(input, 0)
}

function _joinWord (input, index = 0) {
    return input[0] + input[index + 1]
}

module.exports = {
    moneyToWords,
}