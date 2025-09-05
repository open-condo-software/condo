import { TicketAnalyticsGroupBy as TicketGroupBy } from '@app/condo/schema'
import { Row, Col } from 'antd'
import get from 'lodash/get'
import React, { useEffect, useState, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import {
    CHART_CONTAINER_BIG_HEIGHT,
    CHART_CONTENT_ROW_GUTTER,
} from '@condo/domains/analytics/components/CustomChartView'
import { CustomListView } from '@condo/domains/analytics/components/CustomListView'
import TicketChartView from '@condo/domains/analytics/components/TicketChartView'
import { GET_OVERVIEW_DASHBOARD_MUTATION } from '@condo/domains/analytics/gql'
import {
    useDateRangeFilter,
    usePropertyFilter,
} from '@condo/domains/analytics/hooks/useDashboardFilters'
import { useDetailChartView } from '@condo/domains/analytics/hooks/useDetailChartView'

import { TicketHorizontalBarDataMapper } from './dataMappers'

import type { TicketChartCardType } from './dataMappers'

const mapperInstance = TicketHorizontalBarDataMapper([TicketGroupBy.Status, TicketGroupBy.Property])

const TicketByPropertyChart: TicketChartCardType = ({ data, organizationId }) => {
    const intl = useIntl()
    const TicketTitle = intl.formatMessage({ id: 'global.section.tickets' })
    const TicketsByPropertyTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Property' })
    const PropertyTitle = intl.formatMessage({ id: 'field.Address' })

    const title = `${TicketTitle} ${TicketsByPropertyTitle.toLowerCase()}`
    const { open, isOpen, PopupChartView, errorFallback } = useDetailChartView({ title })
    const { dateRange, SearchInput: DateRangeSearch } = useDateRangeFilter()
    const { values: propertyIds, SearchInput: PropertySearch } = usePropertyFilter({ organizationId })

    const [localData, setLocalData] = useState([])

    const [loadPropertyData, { loading }] = useLazyQuery(GET_OVERVIEW_DASHBOARD_MUTATION, {
        onCompleted: (response) => {
            setLocalData(get(response, 'result.overview.ticketByProperty.tickets', []))
        },
        onError: () => { errorFallback() },
    })

    useEffect(() => {
        if (isOpen) {
            loadPropertyData({
                variables: {
                    data: {
                        dv:1,
                        sender: getClientSideSenderInfo(),
                        where: {
                            organization: organizationId,
                            dateFrom: dateRange[0].toISOString(),
                            dateTo: dateRange[1].toISOString(),
                            propertyIds,
                        },
                        groupBy: { aggregatePeriod: 'day' },
                        entities: ['ticketByProperty'],
                    },
                },
            })
        }
    }, [dateRange, isOpen, loadPropertyData, organizationId, propertyIds])

    const chart = useMemo(() => (
        <TicketChartView
            data={localData}
            mainGroup='status'
            mapperInstance={mapperInstance}
            viewMode='bar'
            chartConfig={{ chartOptions: { height: CHART_CONTAINER_BIG_HEIGHT }, animationEnabled: true }}
            loading={loading}
        />
    ), [localData, loading])

    const translations = { property: PropertyTitle }

    return (
        <>
            <Row gutter={CHART_CONTENT_ROW_GUTTER}>
                <Col span={24}>
                    <Typography.Title level={3}>{title}</Typography.Title>
                </Col>
                <Col span={24} onClick={open}>
                    <TicketChartView
                        data={data}
                        mainGroup='status'
                        mapperInstance={mapperInstance}
                        viewMode='bar'
                        chartConfig={{ chartOptions: { height: CHART_CONTAINER_BIG_HEIGHT }, animationEnabled: true }}
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
                        viewMode='bar'
                        mapperInstance={mapperInstance}
                        loading={loading}
                        data={localData}
                        translations={translations}
                    />
                </Col>
            </PopupChartView>
        </>
    )
}

export { TicketByPropertyChart }
