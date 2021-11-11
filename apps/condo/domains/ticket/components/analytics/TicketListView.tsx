import { TableProps as RcTableProps } from 'rc-table/lib/Table'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { Skeleton, Table, TableColumnsType } from 'antd'
import { ticketAnalyticsPageFilters } from '@condo/domains/ticket/utils/helpers'
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
    const DateTitle = intl.formatMessage({ id: 'Date' })
    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const ExecutorTitle = intl.formatMessage({ id: 'field.Executor' })
    const AssigneeTitle = intl.formatMessage({ id: 'field.Responsible' })
    const AllAddressTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.tableColumns.AllAddresses' })
    const CategoryClassifierTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.tableColumns.Classifier' })
    const AllCategoryClassifiersTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.tableColumns.AllClassifiers' })
    const AllExecutorsTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.tableColumns.AllExecutors' })
    const AllAssigneesTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.tableColumns.AllAssignees' })
    const { isSmall } = useLayoutContext()

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
            tableLayout={'fixed'}
            scroll={getScrollConfig(isSmall)}
            dataSource={dataSource}
            columns={tableColumns as TableColumnsType}
            pagination={false}
        />
    )
}

export default TicketListView
