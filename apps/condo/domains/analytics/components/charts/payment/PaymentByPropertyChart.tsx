import { Row, Col } from 'antd'
import get from 'lodash/get'
import React, { useMemo, useState, useEffect } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import {
    CustomChartView,
    CHART_CONTAINER_HEIGHT,
    CHART_CONTENT_ROW_GUTTER,
} from '@condo/domains/analytics/components/CustomChartView'
import { CustomListView } from '@condo/domains/analytics/components/CustomListView'
import { GET_OVERVIEW_DASHBOARD_MUTATION } from '@condo/domains/analytics/gql'
import { usePropertyFilter, useDateRangeFilter } from '@condo/domains/analytics/hooks/useDashboardFilters'
import { useDetailChartView } from '@condo/domains/analytics/hooks/useDetailChartView'

import { PaymentByPropertyDataMapper } from './dataMappers'

import type { IPaymentChartCard } from './dataMappers'

const PaymentByPropertyChart: IPaymentChartCard = ({ data, organizationId }) => {
    const intl = useIntl()
    const ChartTitle = intl.formatMessage({ id: 'pages.reports.paymentsByProperty' })
    const PaidTitle = intl.formatMessage({ id: 'PaymentPaid' })
    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const SumTitle = intl.formatMessage({ id: 'global.sum' })
    const PropertyPercentTitle = intl.formatMessage({ id: 'pages.condo.analytics.paymentPercent' })

    const [localData, setLocalData] = useState([])
    const { open, isOpen, PopupChartView, errorFallback } = useDetailChartView({ title: ChartTitle })
    const { values: propertyIds, SearchInput: PropertySearch } = usePropertyFilter({ organizationId })
    const { dateRange, SearchInput: DateRangeSearch } = useDateRangeFilter()

    const [loadPaymentData, { loading }] = useLazyQuery(GET_OVERVIEW_DASHBOARD_MUTATION, {
        onCompleted: (response) => {
            setLocalData(get(response, 'result.overview.payment.payments', []))
        },
        onError: () => { errorFallback() },
    })

    useEffect(() => {
        if (isOpen) {
            loadPaymentData({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        where: {
                            organization: organizationId,
                            dateFrom: dateRange[0],
                            dateTo: dateRange[1],
                            propertyIds,
                        },
                        groupBy: { aggregatePeriod: 'day' },
                        entities: ['payment'],
                    },
                },
            })
        }
    }, [dateRange, isOpen, loadPaymentData, organizationId, propertyIds])

    const dataMapper = useMemo(() => PaymentByPropertyDataMapper(PaidTitle), [PaidTitle])
    const chart = useMemo(() => (
        <CustomChartView
            viewMode='pie'
            mapperInstance={dataMapper}
            chartConfig={{ chartOptions: { height: CHART_CONTAINER_HEIGHT }, animationEnabled: true }}
            data={localData}
            loading={loading}
        />
    ), [loading, localData, dataMapper])

    const translations = {
        address: AddressTitle,
        sum: SumTitle,
        percent: PropertyPercentTitle,
    }

    return (
        <>
            <Row gutter={CHART_CONTENT_ROW_GUTTER}>
                <Col span={24}>
                    <Typography.Title level={3}>{ChartTitle}</Typography.Title>
                </Col>
                <Col span={24} onClick={open}>
                    <CustomChartView
                        viewMode='pie'
                        mapperInstance={dataMapper}
                        chartConfig={{ chartOptions: { height: CHART_CONTAINER_HEIGHT }, animationEnabled: true }}
                        data={data}
                    />
                </Col>
            </Row>
            <PopupChartView>
                <Col span={24}>
                    <DateRangeSearch disabled={loading} />
                </Col>
                <Col span={24}>
                    {PropertySearch}
                </Col>
                <Col span={24}>
                    {chart}
                </Col>
                <Col span={24}>
                    <CustomListView
                        viewMode='pie'
                        data={localData}
                        loading={loading}
                        mapperInstance={dataMapper}
                        translations={translations}
                    />
                </Col>
            </PopupChartView>
        </>
    )
}

export { PaymentByPropertyChart }
