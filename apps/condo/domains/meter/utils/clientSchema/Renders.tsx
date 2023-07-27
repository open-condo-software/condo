import { Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'
import get from 'lodash/get'
import React from 'react'

import { getTableCellRenderer, RenderReturnType } from '@condo/domains/common/components/Table/Renders'
import { METER_READING_SOURCE_EXTERNAL_IMPORT_TYPE } from '@condo/domains/meter/constants/constants'

const POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

export const getUnitRender = (intl, search: FilterValue) => {
    return function render (text, record) {
        const unitType = get(record, ['meter', 'unitType'], 'flat')

        let unitNamePrefix = null
        let extraTitle = null
        if (text) {
            extraTitle = intl.formatMessage({ id: `ticket.field.unitType.${unitType}` })
            if (unitType !== 'flat') {
                unitNamePrefix = intl.formatMessage({ id: `ticket.field.unitType.prefix.${unitType}` })
            }
        }
        const unitName = text && unitNamePrefix ? `${unitNamePrefix} ${text}` : text
        return getTableCellRenderer({ search, ellipsis: true, extraPostfixProps: POSTFIX_PROPS, extraTitle })(unitName)
    }
}

export const getResourceRender = (intl, search?: FilterValue | string) => {
    return function render (text, meterReading): RenderReturnType {
        const AutoMessage = intl.formatMessage({ id: 'meter.autoPrefix' })
        const value = get(meterReading, ['meter', 'resource', 'name'])
        const isAutomatic = get(meterReading, ['meter', 'isAutomatic'], false)
        const isExternalSource = Boolean(get(meterReading, ['source', 'type']) === METER_READING_SOURCE_EXTERNAL_IMPORT_TYPE)

        const postfix = isAutomatic && isExternalSource ? (
            <Typography.Text type='warning'>
                {` (${AutoMessage})`}
            </Typography.Text>
        ) : null

        return getTableCellRenderer({ search, ellipsis: true, postfix, extraPostfixProps: POSTFIX_PROPS })(value)
    }
}