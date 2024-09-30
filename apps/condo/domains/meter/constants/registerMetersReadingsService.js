const DATE_SYMBOLS_ORDER_VARIANTS = [
    ['YYYY', 'MM', 'DD'],
    ['DD', 'MM', 'YYYY'],
    ['MM', 'YYYY'],
    ['YYYY', 'MM'],
]
const DATE_SYMBOLS_DELIMITERS = ['/', '.', '-']
const TIME_VARIANTS = [
    'HH:mm:ss',
    'HH:mm',
]

const DATE_FORMATS = DATE_SYMBOLS_ORDER_VARIANTS
    .flatMap((order) => DATE_SYMBOLS_DELIMITERS.map(delimiter => order.join(delimiter)))
const DATE_TIME_FORMATS = DATE_FORMATS
    .flatMap((dateFormat) => TIME_VARIANTS.map(timeVariant => [dateFormat, timeVariant].join(' ')))

const ISO_DATE_FORMAT = 'YYYY-MM-DD'
const EUROPEAN_DATE_FORMAT = 'DD.MM.YYYY'
const DATE_PARSING_FORMATS = [
    ...DATE_TIME_FORMATS,
    ...DATE_FORMATS,

    'YYYY-MM-DDTHH:mm:ss.SSSZ', // The result of dayjs().toISOString()
    'YYYY-MM-DDTHH:mm:ss.SSS',
].sort((a, b) => b.length - a.length) // Order matters! see "Differences to moment" https://day.js.org/docs/en/parse/string-format

const READINGS_LIMIT = 500

module.exports = {
    DATE_PARSING_FORMATS,
    ISO_DATE_FORMAT,
    EUROPEAN_DATE_FORMAT,
    READINGS_LIMIT,
}