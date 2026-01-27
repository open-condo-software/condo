import { FormInstance } from 'antd'
import dayjs from 'dayjs'
import isEmpty from 'lodash/isEmpty'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'
import isUndefined from 'lodash/isUndefined'
import { NextRouter } from 'next/router'
import React from 'react'


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

export const getInitialArchivedOrActiveMeter = (router: NextRouter, field: 'isShowActiveMeters' | 'isShowArchivedMeters', defaultValue = false): boolean => {
    if (field in router.query && typeof router.query[field] === 'string') {
        try {
            return (JSON.parse(router.query[field]))
        } catch (error) {
            console.error('Failed to parse property value %s: %s', field, error)
            return defaultValue
        }
    }
    return defaultValue
}


export const handleUnitFieldsChange = (formRef:  React.MutableRefObject<FormInstance<any>>) => (changedValues) => {
    const relevantFieldsChanged = Object.keys(changedValues).some(
        (key) => key === 'unitName' || key === 'unitType'
    )

    if (relevantFieldsChanged && formRef.current?.getFieldValue('accountNumber')) {
        formRef.current.validateFields(['accountNumber'])
    }
}
