const { isString, isNumber, isUndefined,
    isEmpty, get, pick } = require('lodash')

// TODO(YEgorLu): DOMA-10497 values in RegisterMetersReadings should not be processed like that. Move in to import or rewrite.

/**
 * @deprecated
 * @param value
 * @return {undefined|string|null}
 */
function normalizeMeterValue (value) {
    if (!(isString(value) || isNumber(value) || isUndefined(value))) return null
    if (isUndefined(value)) return value

    const transformedValue = String(value).trim().replaceAll(',', '.')
    if (isEmpty(transformedValue)) return undefined
    return String(Number(transformedValue))
}

/**
 * @deprecated
 * @param {string | null | undefined} value
 * @return {boolean}
 */
function validateMeterValue (value) {
    if (!isString(value) && !isUndefined(value)) return false
    if (isUndefined(value)) return true

    return !isEmpty(value) && !isNaN(Number(value)) && isFinite(Number(value)) && Number(value) >= 0
}

/**
 * @deprecated
 * @param {MeterReading} meterReading
 * @return {Object}
 */
function meterReadingAsResult (meterReading) {
    return {
        id: meterReading.id,
        meter: {
            ...pick(meterReading.meter, ['id', 'unitType', 'unitName', 'accountNumber', 'number']),
            property: pick(meterReading.meter.property, ['id', 'address', 'addressKey']),
        },
    }
}

/**
 * @deprecated
 * @param {Meter} meter
 * @param {RegisterMetersReadingsMeterMetaInput} changedFields
 * @param {boolean} isPropertyMeters
 * @return {boolean}
 */
function shouldUpdateMeter (meter, changedFields, isPropertyMeters = false) {
    const fieldsToUpdate = [
        'numberOfTariffs',
        'verificationDate',
        'nextVerificationDate',
        'installationDate',
        'commissioningDate',
        'sealingDate',
        'controlReadingsDate',
        'isAutomatic',
        'archiveDate',
    ]

    if (!isPropertyMeters) {
        fieldsToUpdate.push('accountNumber', 'place')
    }

    return fieldsToUpdate.some(field => {
        const newValue = get(changedFields, field)
        const currentValue = get(meter, field)

        return newValue !== undefined && newValue !== currentValue
    })
}

module.exports = {
    normalizeMeterValue,
    shouldUpdateMeter,
    meterReadingAsResult,
    validateMeterValue,
}