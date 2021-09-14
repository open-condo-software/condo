import React from 'react'
import { useIntl } from '@core/next/intl'
import { Skeleton, Table, TableColumnsType } from 'antd'
import { ticketAnalyticsPageFilters } from '@condo/domains/ticket/utils/helpers'
import { ITicketAnalyticsPageWidgetProps } from './TicketChartView'

interface ITicketAnalyticsPageListViewProps extends ITicketAnalyticsPageWidgetProps {
    filters: null | ticketAnalyticsPageFilters
}

const TicketListView: React.FC<ITicketAnalyticsPageListViewProps> = ({
    loading = false,
    data,
    viewMode,
    mapperInstance,
    filters }) => {
    const intl = useIntl()
    const DateTitle = intl.formatMessage({ id: 'Date' })
    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const AllAddressTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.tableColumns.AllAddresses' })
    const CategoryClassifierTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.tableColumns.Classifier' })
    const AllCategoryClassifiersTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.tableColumns.AllClassifiers' })
    if (data === null || filters === null || loading) {
        return <Skeleton loading={loading} active paragraph={{ rows: 10 }} />
    }
    const restOptions = {
        translations: {
            date: DateTitle,
            address: AddressTitle,
            categoryClassifier: CategoryClassifierTitle,
            allCategoryClassifiers: AllCategoryClassifiersTitle,
            allAddresses: AllAddressTitle,
        },
        filters: {
            addresses: filters.addressList.map(({ value }) => value),
            categoryClassifiers: filters.classifierList.map(({ value }) => value),
        },
    }
    const { tableColumns, dataSource } = mapperInstance.getTableConfig(viewMode, data, restOptions)
    return (
        <Table
            bordered
            tableLayout={'fixed'}
            scroll={{ scrollToFirstRowOnChange: false }}
            dataSource={dataSource}
            columns={tableColumns as TableColumnsType}
            pagination={false}
        />
    )
}

export default TicketListView
