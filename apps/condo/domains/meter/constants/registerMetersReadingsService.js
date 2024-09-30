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


const ISO_DATE_FORMAT = 'YYYY-MM-DD'
const EUROPEAN_DATE_FORMAT = 'DD.MM.YYYY'
const DATE_PARSING_FORMATS = [
    'YYYY-MM-DDTHH:mm:ss.SSS[Z]', // The result of dayjs().toISOString()
    `${ISO_DATE_FORMAT} HH:mm:ss`, `${EUROPEAN_DATE_FORMAT} HH:mm:ss`, // Up to seconds
    `${ISO_DATE_FORMAT} HH:mm`, `${EUROPEAN_DATE_FORMAT} HH:mm`, // Up to minutes
    ISO_DATE_FORMAT, EUROPEAN_DATE_FORMAT, // No time
    'YYYY-MM', 'MM-YYYY', 'YYYY.MM', 'MM.YYYY', // Some exotic cases
]
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

const SYMBOLS_TO_CUT_FROM_DATES_REGEXP = /[^-_:.,( )/\d]/g

module.exports = {
    ERRORS,
    DATE_PARSING_FORMATS,
    ISO_DATE_FORMAT,
    EUROPEAN_DATE_FORMAT,
    SYMBOLS_TO_CUT_FROM_DATES_REGEXP,
    READINGS_LIMIT,
}