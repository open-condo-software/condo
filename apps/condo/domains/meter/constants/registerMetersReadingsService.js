const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const {
    TOO_MUCH_READINGS,
    ORGANIZATION_NOT_FOUND,
    PROPERTY_NOT_FOUND,
    INVALID_METER_VALUES,
    MULTIPLE_METERS_FOUND,
    INVALID_ACCOUNT_NUMBER,
    INVALID_METER_NUMBER,
    INVALID_DATE,
} = require('@condo/domains/meter/constants/errors')

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

const ERRORS = {
    TOO_MUCH_READINGS: (sentCount) => ({
        code: BAD_USER_INPUT,
        type: TOO_MUCH_READINGS,
        message: `Too much readings. Maximum is ${READINGS_LIMIT}.`,
        messageForUser: 'api.meter.registerMetersReadings.TOO_MUCH_READINGS',
        messageInterpolation: { limit: READINGS_LIMIT, sentCount },
    }),
    ORGANIZATION_NOT_FOUND: {
        code: BAD_USER_INPUT,
        type: ORGANIZATION_NOT_FOUND,
        message: 'Organization not found',
        messageForUser: 'api.meter.registerMetersReadings.ORGANIZATION_NOT_FOUND',
    },
    PROPERTY_NOT_FOUND: {
        code: BAD_USER_INPUT,
        type: PROPERTY_NOT_FOUND,
        message: 'Property not found',
        messageForUser: 'api.meter.registerMetersReadings.PROPERTY_NOT_FOUND',
    },
    INVALID_METER_VALUES: (valuesList) => ({
        code: BAD_USER_INPUT,
        type: INVALID_METER_VALUES,
        message: 'Invalid meter values',
        messageForUser: 'api.meter.registerMetersReadings.INVALID_METER_VALUES',
        messageInterpolation: { valuesList },
    }),
    MULTIPLE_METERS_FOUND: (count) => ({
        code: BAD_USER_INPUT,
        type: MULTIPLE_METERS_FOUND,
        message: 'Multiple meters found',
        messageForUser: 'api.meter.registerMetersReadings.MULTIPLE_METERS_FOUND',
        messageInterpolation: { count },
    }),
    INVALID_ACCOUNT_NUMBER: {
        code: BAD_USER_INPUT,
        type: INVALID_ACCOUNT_NUMBER,
        message: 'Invalid account number',
        messageForUser: 'meter.import.error.AccountNumberInvalidValue',
    },
    INVALID_METER_NUMBER: {
        code: BAD_USER_INPUT,
        type: INVALID_METER_NUMBER,
        message: 'Invalid meter number',
        messageForUser: 'meter.import.error.MeterNumberInvalidValue',
    },
    INVALID_DATE: (columnName) => ({
        code: BAD_USER_INPUT,
        type: INVALID_DATE,
        message: 'Invalid date',
        messageForUser: 'meter.import.error.WrongDateFormatMessage',
        messageInterpolation: { columnName, format: [ISO_DATE_FORMAT, EUROPEAN_DATE_FORMAT].join('", "') },
    }),
}



module.exports = {
    ERRORS,
    DATE_PARSING_FORMATS,
    ISO_DATE_FORMAT,
    EUROPEAN_DATE_FORMAT,
    READINGS_LIMIT,
}