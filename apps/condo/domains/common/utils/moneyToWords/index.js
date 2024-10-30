const LOCALES = require('./locales')

const formatRegExp = /\$([a-z]+)/gi

let currency, smallDischarges, bigDischarges

const setWordsToConvert = (locale = 'ru', currencyCode = 'RUB') => {
    if (!(locale in LOCALES)) {
        throw new Error(`Unknown Locale "${locale}"`)
    }
    const wordsToConvert = LOCALES[locale]
    if (!(wordsToConvert.currency[currencyCode])) {
        throw new Error(`Unknown currencyCode "${currencyCode}"`)
    }
    currency = wordsToConvert.currency[currencyCode]
    smallDischarges = wordsToConvert.smallDischarges
    bigDischarges = wordsToConvert.bigDischarges
}

const defaultOptions = {
    locale: 'ru',
    currencyCode: 'RUB',
    format: '$WholeString $wholeCurrency $decimalString $decimalCurrency',
}

const moneyToWords = (input, options = {}) => {
    options = Object.assign({}, defaultOptions, options)

    if (options.locale) setWordsToConvert(options.locale, options.currencyCode)

    if (!isValidNumber(input)) throw new Error(`Invalid Number '${input}'`)

    let [base = '0', dop = '00'] = parseNumber(input)

    dop = dop.slice(0, 2)
    if (dop.length === 1) {
        dop = (dop + '00').slice(0, 2)
    } else {
        dop = ('00' + dop).slice(-2)
    }

    return options.format.replace(formatRegExp, (find, arg) => {
        switch (arg) {
            case 'wholeString': return numbersInWords(input)
            case 'wholeCurrency': return counterWord(currency[0], +base.slice(-2))
            case 'WholeString': return firstUpper(numbersInWords(input))
            case 'WholeCurrency': return firstUpper(counterWord(currency[0], +base.slice(-2)))
            case 'decimal': return dop
            case 'decimalString': return numbersInWords(+dop, true)
            case 'decimalCurrency': return counterWord(currency[1], +dop)
            case 'DecimalString': return firstUpper(numbersInWords(+dop, true))
            case 'DecimalCurrency': return firstUpper(counterWord(currency[1], +dop))
            default: return find
        }
    })
}

const isValidNumber = (input) => {
    return !isNaN(input) && input.length !== 0
}

const parseNumber = (input) => {
    return input
        .toString()
        .replace(/[\s\t-]+/g, '')
        .split(/[.,]/)
}

const joinWord = (input, index = 0) => {
    return input[0] + input[index + 1]
}

const firstUpper = (input) => {
    return input.slice(0, 1).toUpperCase() + input.slice(1).toLocaleLowerCase()
}

const counterWord = (input, counter) => {
    const units = counter % 10

    if (counter > 10 && counter < 20)
        return joinWord(input, 0)

    if (units == 1)
        return joinWord(input, 1)

    if (units > 1 && units < 5)
        return joinWord(input, 2)

    return joinWord(input, 0)
}

const numbersInWords = (input, com = false) => {
    const output = []

    let [num] = parseNumber(input)

    let deep = 0

    if (!num || num === '0')
        return smallDischarges[0][0]

    while (num.length) {
        const row = []
        const current = +num.slice(-3)
        num = num.slice(0, -3)

        const hundreds = current / 100 | 0
        const dozens = current / 10 % 10 | 0
        const units = current % 10

        if (current) {
            row.push(smallDischarges[4][hundreds])

            if (dozens === 1) {
                row.push(smallDischarges[2][units])
            } else {
                row.push(smallDischarges[3][dozens])

                if (deep === 1 || deep == 0 && com) {
                    row.push(
                        smallDischarges[5][units] ?? smallDischarges[1][units]
                    )
                } else {
                    row.push(smallDischarges[1][units])
                }
            }

            if (deep) {
                row.push(counterWord(bigDischarges[deep] ?? bigDischarges[0], current))
            }
        }

        const rowString = row.filter(e => e && e != '-').join(' ')

        if (rowString)
            output.unshift(rowString)

        deep++
    }

    return output.join(' ')
}

module.exports = {
    moneyToWords,
}