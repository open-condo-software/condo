import { FilterValue } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import React from 'react'

import { FilterComponent, FilterComponentProps, TableColumn, Tooltip, Typography } from '@open-condo/ui'

import { getTableCellRenderer, RenderReturnType } from '@condo/domains/common/components/Table/Renders'


const ONE_LINE_ELLIPSIS = { rows: 1, expandable: false }
const COLUMN_TITLE_STYLE: React.CSSProperties = { minWidth: 0, overflow: 'hidden', width: '100%' }

export const withPaymentFilterWidth = (
    filterComponent: TableColumn['filterComponent'],
    width: string
): FilterComponent | undefined => {
    if (typeof filterComponent !== 'function') return undefined

    const PaymentFilterWithWidth = (props: FilterComponentProps): React.ReactNode => (
        <div style={{ width }}>
            {React.createElement(filterComponent as React.ComponentType<FilterComponentProps>, props)}
        </div>
    )

    return PaymentFilterWithWidth
}

export const getPaymentDateOnlyRender = (search?: FilterValue | string) => {
    return function render (stringDate: string): RenderReturnType {
        if (!stringDate) return '—'

        return getTableCellRenderer({ search, ellipsis: ONE_LINE_ELLIPSIS })(dayjs(stringDate).format('DD.MM.YYYY'))
    }
}

export const getEllipsedPaymentColumnTooltip = (columnTitle: string, tooltipTitle: string): React.ReactElement => (
    <Tooltip title={tooltipTitle} placement='top'>
        <div style={COLUMN_TITLE_STYLE}>
            <Typography.Paragraph
                ellipsis={ONE_LINE_ELLIPSIS}
                size='medium'
                type='secondary'
            >
                {columnTitle}
            </Typography.Paragraph>
        </div>
    </Tooltip>
)
