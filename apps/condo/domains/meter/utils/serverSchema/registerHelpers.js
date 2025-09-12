const dayjs = require('dayjs')
const get = require('lodash/get')
const isNil = require('lodash/isNil')
const set = require('lodash/set')
const uniq = require('lodash/uniq')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { find } = require('@open-condo/keystone/schema')
const { i18n } = require('@open-condo/locales/loader')

const { isDateStrValid: isDateStrValidUtils, tryToISO: tryToISOUtils } = require('@condo/domains/common/utils/import/date')
const {
    TOO_MUCH_READINGS,
    ORGANIZATION_NOT_FOUND,
    PROPERTY_NOT_FOUND,
    INVALID_METER_VALUES,
    MULTIPLE_METERS_FOUND,
    INVALID_METER_NUMBER,
    INVALID_DATE,
    INVALID_ACCOUNT_NUMBER,
} = require('@condo/domains/meter/constants/errors')
const { READINGS_LIMIT, DATE_FIELD_PATH_TO_TRANSLATION, DATE_FIELD_PATHS } = require('@condo/domains/meter/constants/registerMetersReadingsService')
const { validateMeterValue, normalizeMeterValue } = require('@condo/domains/meter/utils/meter.utils')

const DATE_FORMAT = 'YYYY-MM-DD'
const UTC_DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'

const ERRORS = {
    TOO_MUCH_READINGS: {
        code: BAD_USER_INPUT,
        type: TOO_MUCH_READINGS,
        message: 'Too much readings. {sentCount} sent, limit is {limit}.',
        messageForUser: 'api.meter.registerMetersReadings.TOO_MUCH_READINGS',
        messageInterpolation: {
            limit: READINGS_LIMIT,
            sentCount: '??',  // runtime value
        },
    },
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
    INVALID_METER_VALUES: {
        code: BAD_USER_INPUT,
        type: INVALID_METER_VALUES,
        message: 'Invalid meter values',
        messageForUser: 'api.meter.registerMetersReadings.INVALID_METER_VALUES',
        messageInterpolation: { valuesList: '"{column}"="{errorValue}"' },
    },
    MULTIPLE_METERS_FOUND: {
        code: BAD_USER_INPUT,
        type: MULTIPLE_METERS_FOUND,
        message: 'Multiple meters found',
        messageForUser: 'api.meter.registerMetersReadings.MULTIPLE_METERS_FOUND',
        messageInterpolation: { count: '??' },
    },
    INVALID_ACCOUNT_NUMBER: {
        code: BAD_USER_INPUT,
        type: INVALID_ACCOUNT_NUMBER,
        message: 'Invalid account number',
        messageForUser: 'api.meter.registerMetersReadings.INVALID_ACCOUNT_NUMBER',
    },
    INVALID_METER_NUMBER: {
        code: BAD_USER_INPUT,
        type: INVALID_METER_NUMBER,
        message: 'Invalid meter number',
        messageForUser: 'api.meter.registerMetersReadings.INVALID_METER_NUMBER',
    },
    INVALID_DATE: {
        code: BAD_USER_INPUT,
        type: INVALID_DATE,
        message: 'Invalid date',
        messageForUser: 'api.meter.registerMetersReadings.INVALID_DATE',
        messageInterpolation: { columnName: 'columnName', format: [UTC_DATE_FORMAT, DATE_FORMAT].join('", "') },
    },
}


function transformToPlainObject (input) {
    let result = {}

    for (let key in input) {
        if (typeof input[key] === 'object' && input[key] !== null && input[key].id) {
            result[key] = input[key].id
        } else {
            result[key] = input[key]
        }
    }

    return result
}

function isDateStrValid (dateStr) {
    return isDateStrValidUtils(dateStr, [DATE_FORMAT, UTC_DATE_FORMAT])
}

function tryToISO (dateStr) {
    return tryToISOUtils(dateStr, [DATE_FORMAT, UTC_DATE_FORMAT])
}

function getDateStrValidationError (context, locale, reading) {
    const isoDateFormatMessage = i18n('iso.date.format', { locale })
    const getError = (datePath) => new GQLError({
        ...ERRORS.INVALID_DATE,
        messageInterpolation: {
            columnName: i18n(DATE_FIELD_PATH_TO_TRANSLATION[datePath], { locale }),
            format: [
                UTC_DATE_FORMAT,
                isoDateFormatMessage,
            ].join('", "'),
        },
    }, context)

    for (const { path, nullable } of DATE_FIELD_PATHS) {
        const dateStr = get(reading, path)

        if (!nullable && isNil(dateStr)) {
            return getError(path)
        }

        if (nullable && isNil(dateStr)) {
            continue
        }

        if (!isDateStrValid(dateStr)) {
            return getError(path)
        }
    }
    return null
}

async function getResolvedAddresses (propertyResolver, readings) {
    return await propertyResolver.normalizeAddresses(readings.reduce((res, reading) => ({
        ...res,
        [reading.address]: {
            address: reading.address,
            addressMeta: reading.addressInfo,
        },
    }), {}))
}

function getAddressesKeys (readings, resolvedAddresses) {
    return uniq(
        readings
            .map((reading) => get(resolvedAddresses, [reading.address, 'addressResolve', 'propertyAddress', 'addressKey']))
            .filter(Boolean)
    )
}

/**
 * @typedef {Partial<{value1: string, value2: string, value3: string, value4: string}>} CondoMeterReadingLikeShape
 */

/**
 * Returns sorted (by key) values from reading-like object
 * @param {CondoMeterReadingLikeShape} reading
 * @returns {string[]}
 */
function getSortedValues (reading) {
    const values = getValues(reading)

    const sortedValues = Object.keys(values)
        // Sanitize
        .filter(key => values[key] !== null && values[key] !== undefined)
        // Sort
        .sort()
        // Map to values
        .map(key => values[key])

    return sortedValues
}

/**
 * Creates a unique key for a meter reading based on meter id, and sorted values.
 * @param {string} meterId The meter's uuid
 * @param {any[]} sortedValues values sorted by field names (value1, value2, ...)
 * @returns {string} The unique key
 */
function createMeterReadingKey (meterId, sortedValues) {
    return `${meterId}_${sortedValues.join('_')}`
}

async function getMeterReadingsForSearchingDuplicates (readings, meters, properties, readingModel) {
    const orConditions = readings.map((reading) => {
        const values = getValues(reading)
        const sanitizedValues = Object.keys(values).reduce((acc, key) => {
            if (isNil(values[key])) return acc
            return { ...acc, [key]: values[key] }
        }, {})
        return { AND: [sanitizedValues] }
    })

    const plainMeterReadings = await find(readingModel, {
        meter: { id_in: meters.map(meter => meter.id) },
        OR: orConditions,
        deletedAt: null,
    })

    const propertyByIdMap = properties.reduce((acc, property) => {
        acc[property.id] = property
        return acc
    }, {})

    const metersWithPropertyByIdMap = meters.reduce((acc, meter) => {
        acc[meter.id] = {
            ...meter,
            property: propertyByIdMap[meter.property],
        }
        return acc
    }, {})
    const meterReadings = plainMeterReadings.map(reading => ({
        ...reading,
        meter: metersWithPropertyByIdMap[reading.meter],
    }))

    return meterReadings.reduce((acc, meterReading) => {
        const key = createMeterReadingKey(meterReading.meter.id, getSortedValues(meterReading))

        acc[key] = meterReading

        return acc
    }, {})
}

function getFieldsToUpdate (reading, isPropertyMeter = false) {

    return {
        ...!isPropertyMeter ? { accountNumber: reading.accountNumber.trim() } : {},
        ...!isPropertyMeter ? { place: get(reading, ['meterMeta', 'place']) || undefined } : {},
        numberOfTariffs: get(reading, ['meterMeta', 'numberOfTariffs']),
        verificationDate: tryToISO(get(reading, ['meterMeta', 'verificationDate'])),
        nextVerificationDate: tryToISO(get(reading, ['meterMeta', 'nextVerificationDate'])),
        installationDate: tryToISO(get(reading, ['meterMeta', 'installationDate'])),
        commissioningDate: tryToISO(get(reading, ['meterMeta', 'commissioningDate'])),
        sealingDate: tryToISO(get(reading, ['meterMeta', 'sealingDate'])),
        controlReadingsDate: tryToISO(get(reading, ['meterMeta', 'controlReadingsDate'])),
        isAutomatic: get(reading, ['meterMeta', 'isAutomatic']),
        archiveDate: get(reading, ['meterMeta', 'archiveDate']),
    }
}

function getValuesList (errorValuesKeys, errorValues, locale) {
    return errorValuesKeys.map((errKey) => {
        const column = i18n(`meter.import.column.${errKey}`, { locale })
        return `"${column}"="${errorValues[errKey]}"`
    }).join(', ')
}

function getMeterDates (reading) {
    return {
        verificationDate: tryToISO(get(reading, ['meterMeta', 'verificationDate'])),
        nextVerificationDate: tryToISO(get(reading, ['meterMeta', 'nextVerificationDate'])),
        installationDate: tryToISO(get(reading, ['meterMeta', 'installationDate'])),
        commissioningDate: tryToISO(get(reading, ['meterMeta', 'commissioningDate'])),
        sealingDate: tryToISO(get(reading, ['meterMeta', 'sealingDate'])),
        controlReadingsDate: tryToISO(get(reading, ['meterMeta', 'controlReadingsDate'])),
        archiveDate: tryToISO(get(reading, ['meterMeta', 'archiveDate'])),
    }
}

function getMeterFields (isPropertyMeter = false) {
    return (organization, property, reading, values, resolvedAddresses) => {
        const accountNumber = reading.accountNumber?.trim()
        const unitType = get(reading, ['addressInfo', 'unitType'], get(resolvedAddresses, [reading.address, 'addressResolve', 'unitType'], '')).trim() || null
        const unitName = get(reading, ['addressInfo', 'unitName'], get(resolvedAddresses, [reading.address, 'addressResolve', 'unitName'], '')).trim() || null

        return {
            organization: { connect: organization },
            property: { connect: { id: property.id } },
            number: reading.meterNumber.trim(),
            resource: { connect: reading.meterResource },
            numberOfTariffs: get(reading, ['meterMeta', 'numberOfTariffs'], Object.values(values).filter(Boolean).length),
            isAutomatic: get(reading, ['meterMeta', 'isAutomatic']),
            ...!isPropertyMeter ? {
                unitType,
                unitName,
                accountNumber,
                place: get(reading, ['meterMeta', 'place']),
            } : {},
        }
    }
}

/**
 * Returns values from reading-like object
 * @param {CondoMeterReadingLikeShape} reading Meter reading like object
 * @param {object} errorValues Object to store errors (will be mutated)
 * @returns {object} Object with values
 */
function getValues (reading, errorValues) {
    return ['value1', 'value2', 'value3', 'value4'].reduce((result, currentValue) => {
        const value = reading[currentValue]

        if (isNil(value)) return result

        const normalizedValue = normalizeMeterValue(value)

        if (!validateMeterValue(normalizedValue)) {
            set(errorValues, currentValue, value)
            return result
        }

        return {
            ...result,
            [currentValue]: normalizedValue,
        }
    }, {})
}

function getReadingFields (isPropertyMeter = false) {
    return (meterId, readingSource, reading, values) => {
        return {
            meter: { connect: { id: meterId } },
            source: { connect: readingSource },
            date: tryToISO(reading.date),
            ...values,
            ...!isPropertyMeter ? {
                billingStatus: get(reading, 'billingStatus', null),
                billingStatusText: get(reading, 'billingStatusText', null),
            } : {},
        }
    }
}
module.exports = {
    ERRORS,
    transformToPlainObject,
    isDateStrValid,
    tryToISO,
    getDateStrValidationError,
    getResolvedAddresses,
    getAddressesKeys,
    getMeterReadingsForSearchingDuplicates,
    getFieldsToUpdate,
    getValuesList,
    getMeterDates,
    getMeterFields,
    getValues,
    getReadingFields,
    createMeterReadingKey,
    getSortedValues,
}