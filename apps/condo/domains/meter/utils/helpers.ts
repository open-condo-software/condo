import { isUndefined } from 'lodash'
import isEmpty from 'lodash/isEmpty'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'


export const validateMeterValue = (value: string | null | undefined): boolean => {
    if (!isString(value) && !isUndefined(value)) return false
    if (isUndefined(value)) return true

    return !isEmpty(value) && !isNaN(Number(value)) && isFinite(Number(value)) && Number(value) >= 0
}

export const normalizeMeterValue = (value): string | null | undefined => {
    if (!(isString(value) || isNumber(value) || isUndefined(value))) return null
    if (isUndefined(value)) return value

    const transformedValue = String(value).trim().replaceAll(',', '.')
    if (isEmpty(transformedValue)) return undefined
    return String(Number(transformedValue))
}
