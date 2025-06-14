import { MeterReading, PropertyMeterReading } from '@app/condo/schema'
import { Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'
import dayjs from 'dayjs'
import get from 'lodash/get'
import React from 'react'

import { Tag } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { getTableCellRenderer, renderMeterReading, RenderReturnType } from '@condo/domains/common/components/Table/Renders'
import { LOCALES } from '@condo/domains/common/constants/locale'
import { ELECTRICITY_METER_RESOURCE_ID, METER_READING_SOURCE_EXTERNAL_IMPORT_TYPE } from '@condo/domains/meter/constants/constants'
import { getHumanizedVerificationDateDifference } from '@condo/domains/meter/utils/helpers'

const POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

const DATE_FORMAT = 'DD.MM.YYYY'

export const getUnitRender = (intl, search: FilterValue, isMeter: boolean) => {
    return function render (text, record) {
        const unitType = get(record, isMeter ? ['unitType'] : ['meter', 'unitType'], 'flat')

        let unitNamePrefix = null
        let extraTitle = null
        if (text) {
            extraTitle = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.${unitType}` })
            if (unitType !== 'flat') {
                unitNamePrefix = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.prefix.${unitType}` })
            }
        }
        const unitName = text && unitNamePrefix ? `${unitNamePrefix} ${text}` : text
        return getTableCellRenderer({ search, ellipsis: true, extraPostfixProps: POSTFIX_PROPS, extraTitle })(unitName)
    }
}

export const getResourceRender = (intl, isMeter: boolean, search?: FilterValue | string) => {
    return function render (text, meterReadingOrMeter): RenderReturnType {
        const AutoMessage = intl.formatMessage({ id: 'pages.condo.meter.AutoPrefix' })
        const value = get(meterReadingOrMeter, isMeter ? ['resource', 'name'] : ['meter', 'resource', 'name'])
        const isAutomatic = get(meterReadingOrMeter, isMeter ? 'isAutomatic' : ['meter', 'isAutomatic'], false)
        const isExternalSource = Boolean(get(meterReadingOrMeter, ['source', 'type']) === METER_READING_SOURCE_EXTERNAL_IMPORT_TYPE)

        const postfix = isAutomatic && isExternalSource ? (
            <Typography.Text type='warning'>
                {` (${AutoMessage})`}
            </Typography.Text>
        ) : null

        return getTableCellRenderer({ search, ellipsis: true, postfix, extraPostfixProps: POSTFIX_PROPS })(value)
    }
}

export const getNextVerificationDateRender = (intl, search?: FilterValue | string, prefix = '\n') => {
    return function render (nextVerificationDate: string): RenderReturnType {
        const OverdueMessage = intl.formatMessage({ id: 'pages.condo.meter.VerificationDate.Overdue' })
        let extraHighlighterProps
        let extraTitle

        if (!nextVerificationDate) return '—'

        const locale = get(LOCALES, intl.locale)
        const date = locale ? dayjs(nextVerificationDate).locale(locale) : dayjs(nextVerificationDate)
        const text = `${date.format(DATE_FORMAT)}`

        if (date.isBefore(dayjs(), 'day')) {
            extraHighlighterProps = { type: 'danger' }
            const overdueDiff = getHumanizedVerificationDateDifference(nextVerificationDate)
            extraTitle = OverdueMessage.replace('{days}', overdueDiff)
        }

        return getTableCellRenderer({ search, ellipsis: true, extraPostfixProps: POSTFIX_PROPS,  extraHighlighterProps, extraTitle, underline: false })(text)
    }
}

export const getSourceRender = (intl, search?: FilterValue | string) => {
    return function render (text, meterReading): RenderReturnType {
        const SourceMessage = intl.formatMessage({ id: get(meterReading, ['source', 'name'] ) })

        return getTableCellRenderer({ search, ellipsis: true })(SourceMessage)
    }
}

export const getMeterStatusRender = (intl, search?) => {
    return function render (archiveDate: string): RenderReturnType {
        const activeStatus = intl.formatMessage({ id: 'pages.condo.meter.Meter.isActive' })
        const archivedStatus = intl.formatMessage({ id: 'pages.condo.meter.Meter.outOfOrder' })
        
        return (
            <Tag
                bgColor={ archiveDate ? colors.brown[5] : colors.green[5] }
                textColor={colors.white}
            >
                {archiveDate ? archivedStatus : activeStatus}
            </Tag>
        )
    }
}

export const getConsumptionRender = (intl, records: Array<MeterReading | PropertyMeterReading>, search?: FilterValue | string) => {
    return function render (text, meterReading, index): RenderReturnType {
        const currentValue1 = get(meterReading, 'value1')
        const currentValue2 = get(meterReading, 'value2')
        const currentValue3 = get(meterReading, 'value3')
        const currentValue4 = get(meterReading, 'value4')
        const measure = get(meterReading, ['meter', 'resource', 'measure'], '')
        const resourceId = get(meterReading, ['meter', 'resource', 'id'])

        const allCurrentValues = [currentValue1, currentValue2, currentValue3, currentValue4]

        if (index === records.length - 1) {
            return renderMeterReading(allCurrentValues, resourceId, measure)
        } 
        
        const previousMeterReading = records[index + 1]
        const prevValues = [
            get(previousMeterReading, 'value1'),
            get(previousMeterReading, 'value2'),
            get(previousMeterReading, 'value3'),
            get(previousMeterReading, 'value4'),
        ]
        const consumptionValues = allCurrentValues.map((value, index) => Number(value) - Number(prevValues[index]))

        // ELECTRICITY multi-tariff meter
        if (resourceId === ELECTRICITY_METER_RESOURCE_ID) {
            const formatMeter = (value, index) => !value ? null : <>{`T${index + 1} - ${Number(value)} ${measure}`}<br /></>
            return consumptionValues.map(formatMeter)
        }

        // other resource 1-tariff meter
        if (get(consumptionValues, '0')){
            return `${Number(consumptionValues[0])} ${measure}`
        }

        return null
    }
}
