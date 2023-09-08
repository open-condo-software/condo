import { TicketAnalyticsGroupBy as TicketGroupBy } from '@app/condo/schema'
import { Row, Col } from 'antd'
import get from 'lodash/get'
import React, { useEffect, useState, useMemo } from 'react'

import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { CustomListView } from '@condo/domains/analytics/components/CustomListView'
import TicketChartView from '@condo/domains/analytics/components/TicketChartView'
import { GET_OVERVIEW_DASHBOARD_MUTATION } from '@condo/domains/analytics/gql'
import {
    useExecutorFilter,
    useDateRangeFilter,
    usePropertyFilter,
} from '@condo/domains/analytics/hooks/useDashboardFilters'
import { useDetailChartView } from '@condo/domains/analytics/hooks/useDetailChartView'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

import { TicketHorizontalBarDataMapper } from './dataMappers'

import type { ITicketChartCard } from './dataMappers'

const mapperInstance = TicketHorizontalBarDataMapper([TicketGroupBy.Status, TicketGroupBy.Executor])

const TicketByExecutorChart: ITicketChartCard = ({ data, organizationId }) => {
    const intl = useIntl()
    const TicketTitle = intl.formatMessage({ id: 'global.section.tickets' })
    const TicketsByExecutor = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.User' })
    const ExecutorTitle = intl.formatMessage({ id: 'field.Executor' })

    const title = TicketTitle + ' ' + TicketsByExecutor.toLowerCase()

    const { open, isOpen, PopupChartView } = useDetailChartView({ title })
    const { dateRange, SearchInput: DateRangeSearch } = useDateRangeFilter()
    const { values: executorIds, SearchInput } = useExecutorFilter({ organizationId })
    const { values: propertyIds, SearchInput: PropertySearchInput } = usePropertyFilter({ organizationId })

    const [localData, setLocalData] = useState([])

    const [loadExecutorData, { loading }] = useLazyQuery(GET_OVERVIEW_DASHBOARD_MUTATION, {
        onCompleted: (response) => {
            setLocalData(get(response, 'result.overview.ticketByExecutor.tickets', []))
        },
        onError: error => {console.log(error)},
    })

    useEffect(() => {
        if (isOpen) {
            loadExecutorData({
                variables: {
                    data: {
                        dv:1,
                        sender: getClientSideSenderInfo(),
                        where: {
                            organization: organizationId,
                            dateFrom: dateRange[0].toISOString(),
                            dateTo: dateRange[1].toISOString(),
                            executorIds,
                            propertyIds,
                        },
                        groupBy: { aggregatePeriod: 'day' },
                        entities: ['ticketByExecutor'],
                    },
                },
            })
        }
    }, [isOpen, loadExecutorData, organizationId, dateRange, executorIds, propertyIds])

    const chart = useMemo(() => (
        <TicketChartView
            data={localData}
            viewMode='bar'
            mapperInstance={mapperInstance}
            mainGroup='status'
            chartConfig={{ chartOptions: { height: 350 }, animationEnabled: true }}
            loading={loading}
        />
    ), [localData, loading])

    const translations = { executor: ExecutorTitle }

    return (
        <>
            <Row gutter={[0, 16]}>
                <Col span={24}>
                    <Typography.Title level={3}>{title}</Typography.Title>
                </Col>
                <Col span={24} onClick={open}>
                    <TicketChartView
                        data={data}
                        mainGroup='status'
                        mapperInstance={mapperInstance}
                        viewMode='bar'
                        chartConfig={{ chartOptions: { height: 350 }, animationEnabled: true }}
                    />
                </Col>
            </Row>
            <PopupChartView>
                <Row gutter={[24, 40]}>
                    <Col span={12}>
                        <DateRangeSearch disabled={loading} />
                    </Col>
                    <Col span={12}>
                        {SearchInput}
                    </Col>
                    <Col span={24}>
                        {PropertySearchInput}
                    </Col>
                    <Col span={24}>
                        {chart}
                    </Col>
                    <Col span={24}>
                        <CustomListView
                            viewMode='bar'
                            mapperInstance={mapperInstance}
                            loading={loading}
                            data={localData}
                            translations={translations}
                        />
                    </Col>
                </Row>
            </PopupChartView>
        </>
    )}

export { TicketByExecutorChart }
