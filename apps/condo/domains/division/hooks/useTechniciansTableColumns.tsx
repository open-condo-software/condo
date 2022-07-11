
import { useMemo } from 'react'
import { useIntl } from '@core/next/intl'

import { ColumnType, FilterValue } from 'antd/es/table/interface'

import { map } from 'lodash'
import { Typography } from 'antd'
import { OrganizationEmployee, Division as DivisionType } from '@app/condo/schema'
import { green } from '@ant-design/colors'

import Link from 'next/link'

export interface ITableColumn {
    title: string,
    ellipsis?: boolean,
    sortOrder?: string,
    filteredValue?: FilterValue,
    dataIndex?: string,
    key?: string,
    sorter?: boolean,
    width?: string,
    filterDropdown?: unknown,
    filterIcon?: unknown
}

export const useTableColumns = () => {
    const intl = useIntl()

    const ExecutorNameMessage = intl.formatMessage({ id: 'pages.condo.division.id.executor.name' })
    const ExecutorPhoneMessage = intl.formatMessage({ id: 'pages.condo.division.id.executor.phone' })
    const ExecutorSpecializationsMessage = intl.formatMessage({ id: 'pages.condo.division.id.executor.specializations' })
    const ExecutorSpecializationBlankMessage = intl.formatMessage({ id: 'pages.condo.division.id.executor.SpecializationBlank' })

    const renderExecutorName = (_, { id, name }: OrganizationEmployee) => (
        <Link href={`/employee/${id}`}>
            <Typography.Link style={{ color: green[6], display: 'block' }}>
                {name}
            </Typography.Link>
        </Link>
    )

    const renderSpecializations = specializations => (
        specializations.length > 0
            ? map(specializations, 'name').join(', ')
            : <Typography.Text strong>{ExecutorSpecializationBlankMessage}</Typography.Text>
    )
    return useMemo(() => {
        type ColumnTypes = [
            ColumnType<DivisionType['executors'][number]>,
            ColumnType<DivisionType['executors'][number]['phone']>,
            ColumnType<DivisionType['executors'][number]['specializations']>,
        ]
        const columns: ColumnTypes = [
            {
                title: ExecutorNameMessage,
                dataIndex: 'name',
                key: 'name',
                render: renderExecutorName,
            }, 
            {
                title: ExecutorPhoneMessage,
                dataIndex: 'phone',
                key: 'phone',
            }, 
            {
                title: ExecutorSpecializationsMessage,
                dataIndex: 'specializations',
                key: 'specializations',
                render: renderSpecializations,
            },
        ]
        return columns
    }, [renderExecutorName])
}