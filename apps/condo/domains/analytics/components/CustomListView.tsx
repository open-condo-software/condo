import { Table, TableColumnsType, Skeleton } from 'antd'
import React, { useMemo } from 'react'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import type { CustomChartViewType } from './CustomChart'

type CustomListViewProps = {
    data: null | unknown[]
    viewMode: CustomChartViewType
    mapperInstance: any
    loading?: boolean
    translations: Record<string, string | React.ReactNode>
}

const TABLE_SCROLL_CONFIG = { x: true }
const TABLE_STYLE = { width: 'auto' }

export const CustomListView: React.FC<CustomListViewProps> = (props) => {
    const { loading = false, data, mapperInstance, viewMode, translations } = props
    const { shouldTableScroll } = useLayoutContext()

    const scrollConfig = useMemo(() => shouldTableScroll ? TABLE_SCROLL_CONFIG : {}, [shouldTableScroll])

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
            style={TABLE_STYLE}
            columns={tableColumns as TableColumnsType}
            scroll={scrollConfig}
            pagination={{
                showSizeChanger: false,
                position: ['bottomLeft'],
                pageSize: 5,
            }}
        />
    )
}
