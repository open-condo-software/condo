import { Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'
import dayjs from 'dayjs'
import get from 'lodash/get'
import React from 'react'

import { getTableCellRenderer, RenderReturnType } from '@condo/domains/common/components/Table/Renders'
import { LOCALES } from '@condo/domains/common/constants/locale'
import { METER_READING_SOURCE_EXTERNAL_IMPORT_TYPE } from '@condo/domains/meter/constants/constants'
import { getHumanizedVerificationDateDifference } from '@condo/domains/meter/utils/helpers'

const POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

const DATE_FORMAT = 'DD.MM.YYYY'

export const getUnitRender = (intl, search: FilterValue) => {
    return function render (text, record) {
        const unitType = get(record, ['meter', 'unitType'], 'flat')

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

export const getVerificationDateRender = (intl, isMeter: boolean, search?: FilterValue | string, prefix = '\n') => {
    return function render (verificationDate: string, meterReading): RenderReturnType {
        const OverdueMessage = intl.formatMessage({ id: 'pages.condo.meter.VerificationDate.Overdue' })
        let extraHighlighterProps
        let extraTitle

        if (!verificationDate) return '—'

        const locale = get(LOCALES, intl.locale)
        const date = locale ? dayjs(verificationDate).locale(locale) : dayjs(verificationDate)
        const text = `${date.format(DATE_FORMAT)}`

        const nextVerificationDate = dayjs(get(meterReading, isMeter ? 'nextVerificationDate' : ['meter', 'nextVerificationDate']))

        if (nextVerificationDate.isBefore(dayjs(), 'day')) {
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
