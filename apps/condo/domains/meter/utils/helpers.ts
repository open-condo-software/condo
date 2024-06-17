import dayjs from 'dayjs'
import { isUndefined } from 'lodash'
import isEmpty from 'lodash/isEmpty'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'
import { NextRouter } from 'next/router'


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

export function getHumanizedVerificationDateDifference (nextVerificationDate) {
    const diff = dayjs(nextVerificationDate).diff(dayjs(), 'day')
    const overdueDiff = dayjs.duration(diff, 'days').subtract(1, 'day').humanize()

    return overdueDiff
}

export const getMeterTitleMessage = (intl, meter) => {
    if (!meter) {
        return
    }

    return `${intl.formatMessage({ id: 'pages.condo.meter.id.PageTitle' })} № ${meter.number}`
}

export const getInitialSelectedReadingKeys = (router: NextRouter) => {
    if ('selectedReadingIds' in router.query && isString(router.query.selectedReadingIds)) {
        try {
            return JSON.parse(router.query.selectedReadingIds as string)
        } catch (error) {
            console.warn('Failed to parse property value "selectedReadingIds"', error)
            return []
        }
    }
    return []
}