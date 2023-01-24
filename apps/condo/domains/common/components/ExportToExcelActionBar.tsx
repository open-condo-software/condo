import { Form } from 'antd'
import React  from 'react'

import ActionBar from '@condo/domains/common/components/ActionBar'
import { useExportToExcel, UseExportToExcelInputType } from '@condo/domains/common/hooks/useExportToExcel'


interface IExportToExcelActionBarProps extends UseExportToExcelInputType {
    hidden?: boolean
    disabled?: boolean
}

export const ExportToExcelActionBar: React.FC<IExportToExcelActionBarProps> = (props) => {
    const {
        searchObjectsQuery,
        sortBy,
        exportToExcelQuery,
        hidden = false,
        useTimeZone = true,
        disabled = false,
    } = props

    const { ExportButton } = useExportToExcel({
        searchObjectsQuery,
        sortBy,
        exportToExcelQuery,
        useTimeZone,
    })

    return (
        <Form.Item noStyle>
            <ActionBar hidden={hidden}>
                {props.children}
                <ExportButton disabled={disabled} />
            </ActionBar>
        </Form.Item>
    )
}
