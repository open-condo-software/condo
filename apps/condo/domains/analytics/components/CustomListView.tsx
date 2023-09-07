import { Table, TableColumnsType, Skeleton } from 'antd'
import { TableProps as RcTableProps } from 'rc-table/lib/Table'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import type { CustomChartViewType } from './CustomChart'

type CustomListViewProps = {
    data: null | unknown[]
    viewMode: CustomChartViewType
    mapperInstance: any
    loading?: boolean
    translations: Record<string, string>
}

export const CustomListView: React.FC<CustomListViewProps> = (props) => {
    const { loading = false, data, mapperInstance, viewMode, translations } = props

    if (data === null || loading) {
        return <Skeleton loading={loading} active paragraph={{ rows: 10 }} />
    }

    const restOptions = {
        translations,
    }

    const { tableColumns, dataSource } = mapperInstance.getTableConfig(viewMode, data, restOptions)

    return (
        <Table
            bordered
            tableLayout='fixed'
            dataSource={dataSource}
            columns={tableColumns as TableColumnsType}
            pagination={{
                showSizeChanger: false,
                position: ['bottomLeft'],
                pageSize: 5,
            }}
        />
    )
}
