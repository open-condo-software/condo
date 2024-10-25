const dayjs = require('dayjs')
const { get } = require('lodash')
const isArray = require('lodash/isArray')
const isEmpty = require('lodash/isEmpty')

const { FEEDBACK_VALUES_BY_KEY, FEEDBACK_BAD_OPTIONS, FEEDBACK_GOOD_OPTIONS } = require('@condo/domains/ticket/constants/feedback')
const {
    QUALITY_CONTROL_VALUES_BY_KEY,
    QUALITY_CONTROL_BAD_OPTIONS,
    QUALITY_CONTROL_GOOD_OPTIONS,
} = require('@condo/domains/ticket/constants/qualityControl')


const convertQualityControlOrFeedbackOptionsToText = (options, optionsMessages) => {
    if (!isArray(options) || isEmpty(options) || isEmpty(optionsMessages)) return null
    const selectedOptions = options.map((key) => optionsMessages[key]).filter(Boolean)
    if (selectedOptions.length < 1) return null
    return selectedOptions.join(', ')
}

const filterQualityControlOrFeedbackOptionsByScore = (score, options, badOptions, goodOptions, badScoreKey, goodScoreKey) => {
    if (!isArray(options) || isEmpty(options)) return []
    if (score === badScoreKey) {
        return options.filter(item => badOptions.includes(item))
    }
    if (score === goodScoreKey) {
        return options.filter(item => goodOptions.includes(item))
    }
    return []
}

const filterFeedbackOptionsByScore = (score, options) => {
    return filterQualityControlOrFeedbackOptionsByScore(
        score, options,
        FEEDBACK_BAD_OPTIONS, FEEDBACK_GOOD_OPTIONS,
        FEEDBACK_VALUES_BY_KEY.BAD, FEEDBACK_VALUES_BY_KEY.GOOD
    )
}

const filterQualityControlOptionsByScore = (score, options) => {
    return filterQualityControlOrFeedbackOptionsByScore(
        score, options,
        QUALITY_CONTROL_BAD_OPTIONS, QUALITY_CONTROL_GOOD_OPTIONS,
        QUALITY_CONTROL_VALUES_BY_KEY.BAD, QUALITY_CONTROL_VALUES_BY_KEY.GOOD
    )
}

const buildFullClassifierName = (classifier) => {
    return [
        get(classifier, 'place.name', '').trim(),
        get(classifier, 'category.name', '').trim(),
        get(classifier, 'problem.name', '').trim(),
    ].filter(Boolean).join(' » ')
}

const buildEmptyLineDifferentLength = (long = false) => {
    return long ? '______________________________________________' : '_______________________'
}


const formatDate = (date, timeZone, format = 'DD.MM.YYYY') => {
    return dayjs(date).tz(timeZone).format(format)
}

const renderMoney = (amount, currencyCode, locale) => {
    const options = { currency: currencyCode }
    const numberFormat = new Intl.NumberFormat(locale, options)
    const parts = numberFormat.formatToParts(amount)
    return parts.map((part) => part.value).join('')
}

const bigDischarges = [
    ['…n-лион', 'ов', '', 'а'],
    ['тысяч', '', 'а', 'и'],
    ['миллион', 'ов', '', 'а'],
    ['миллиард', 'ов', '', 'а'],
]

const smallDischarges = [
    ['ноль'],
    ['-', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'],
    ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'],
    ['-', '-', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'],
    ['-', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'],
    ['-', 'одна', 'две'],
]

const joinWord = (input, index = 0) => {
    return input[0] + input[index + 1]
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

const parseNumber = (input) => {
    return input
        .toString()
        .replace(/[\s\t\_\-]+/g, '')
        .split(/[\.\,]/)
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
    convertQualityControlOrFeedbackOptionsToText,
    filterFeedbackOptionsByScore,
    filterQualityControlOptionsByScore,
    buildFullClassifierName,
    buildEmptyLineDifferentLength,
    formatDate,
    renderMoney,
    numbersInWords,
}
