import { Form } from 'antd'
import React, { ReactElement } from 'react'

import { ActionBar } from '@open-condo/ui'

import { useExportToExcel, UseExportToExcelInputType } from '@condo/domains/common/hooks/useExportToExcel'


interface IExportToExcelActionBarProps extends UseExportToExcelInputType {
    hidden?: boolean
    disabled?: boolean
    actions?: [ReactElement, ...ReactElement[]]
}

export const ExportToExcelActionBar: React.FC<IExportToExcelActionBarProps> = (props) => {
    const {
        searchObjectsQuery,
        sortBy,
        exportToExcelQuery,
        hidden = false,
        useTimeZone = true,
        disabled = false,
        actions = [],
    } = props

    const { ExportButton } = useExportToExcel({
        searchObjectsQuery,
        sortBy,
        exportToExcelQuery,
        useTimeZone,
    })

    return !hidden &&  (
        <Form.Item noStyle>
            <ActionBar
                actions={[
                    ...actions,
                    <ExportButton key='export' disabled={disabled} />,
                ]}
            />
        </Form.Item>
    )
}
