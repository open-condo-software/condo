import { Skeleton, Table, TableColumnsType } from 'antd'
import { TableProps as RcTableProps } from 'rc-table/lib/Table'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { ticketAnalyticsPageFilters } from '@condo/domains/analytics/utils/helpers'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import { ITicketAnalyticsPageWidgetProps } from './TicketChartView'

interface ITicketAnalyticsPageListViewProps extends ITicketAnalyticsPageWidgetProps {
    filters: null | ticketAnalyticsPageFilters
}

const getScrollConfig = (isSmall: boolean) => {
    const config: RcTableProps['scroll'] & { scrollToFirstRowOnChange?: boolean; } = {
        scrollToFirstRowOnChange: true,
    }

    if (isSmall) {
        config.x = true
    }

    return config
}

const TicketListView: React.FC<ITicketAnalyticsPageListViewProps> = (props) => {
    const { loading = false, data, viewMode, mapperInstance, filters } = props

    const intl = useIntl()
    const DateTitle = intl.formatMessage({ id: 'date' })
    const AddressTitle = intl.formatMessage({ id: 'field.address' })
    const ExecutorTitle = intl.formatMessage({ id: 'field.executor' })
    const AssigneeTitle = intl.formatMessage({ id: 'field.responsible' })
    const AllAddressTitle = intl.formatMessage({ id: 'analytics.ticketAnalyticsPage.tableColumns.allAddresses' })
    const CategoryClassifierTitle = intl.formatMessage({ id: 'analytics.ticketAnalyticsPage.tableColumns.classifier' })
    const AllCategoryClassifiersTitle = intl.formatMessage({ id: 'analytics.ticketAnalyticsPage.tableColumns.allClassifiers' })
    const AllExecutorsTitle = intl.formatMessage({ id: 'analytics.ticketAnalyticsPage.tableColumns.allExecutors' })
    const AllAssigneesTitle = intl.formatMessage({ id: 'analytics.ticketAnalyticsPage.tableColumns.allAssignees' })
    const { breakpoints } = useLayoutContext()

    if (data === null || filters === null || loading) {
        return <Skeleton loading={loading} active paragraph={{ rows: 10 }} />
    }

    const restOptions = {
        translations: {
            date: DateTitle,
            address: AddressTitle,
            categoryClassifier: CategoryClassifierTitle,
            executor: ExecutorTitle,
            assignee: AssigneeTitle,
            allCategoryClassifiers: AllCategoryClassifiersTitle,
            allAddresses: AllAddressTitle,
            allExecutors: AllExecutorsTitle,
            allAssignees: AllAssigneesTitle,
        },
        filters: {
            address: filters.addressList.map(({ value }) => value),
            categoryClassifier: filters.classifierList.map(({ value }) => value),
            executor: filters.executorList.map(({ value }) => value),
            assignee: filters.responsibleList.map(({ value }) => value),
        },
    }

    const { tableColumns, dataSource } = mapperInstance.getTableConfig(viewMode, data, restOptions)

    return (
        <Table
            bordered
            tableLayout='fixed'
            scroll={getScrollConfig(!breakpoints.TABLET_LARGE)}
            dataSource={dataSource}
            columns={tableColumns as TableColumnsType}
            pagination={false}
        />
    )
}

export default TicketListView
