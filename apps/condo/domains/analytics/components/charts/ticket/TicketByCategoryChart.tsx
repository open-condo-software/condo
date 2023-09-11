import { Row, Col } from 'antd'
import get from 'lodash/get'
import React, { useState, useMemo, useEffect } from 'react'

import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { CHART_CONTAINER_HEIGHT } from '@condo/domains/analytics/components/CustomChartView'
import { CustomListView } from '@condo/domains/analytics/components/CustomListView'
import TicketChartView from '@condo/domains/analytics/components/TicketChartView'
import { GET_OVERVIEW_DASHBOARD_MUTATION } from '@condo/domains/analytics/gql'
import { usePropertyFilter, useDateRangeFilter } from '@condo/domains/analytics/hooks/useDashboardFilters'
import { useDetailChartView } from '@condo/domains/analytics/hooks/useDetailChartView'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

import { TicketByCategoryDataMapper } from './dataMappers'

import type { TicketChartCardType } from './dataMappers'

const TicketByCategoryChart: TicketChartCardType = ({ data, organizationId }) => {
    const intl = useIntl()
    const TicketTitle = intl.formatMessage({ id: 'global.section.tickets' })
    const TicketsByCategory = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Category' })
    const CategoryClassifierTitle = intl.formatMessage({ id: 'global.category' })

    const title = TicketTitle + ' ' + TicketsByCategory.toLowerCase()

    const { open, PopupChartView, isOpen } = useDetailChartView({ title })
    const { SearchInput, values: propertyIds } = usePropertyFilter({ organizationId })
    const { SearchInput: DateRangeFilter, dateRange } = useDateRangeFilter()

    const [localData, setLocalData] = useState([])

    const [loadCategoryData, { loading }] = useLazyQuery(GET_OVERVIEW_DASHBOARD_MUTATION, {
        onCompleted: (response) => {
            setLocalData(get(response, 'result.overview.ticketByCategory.tickets', []))
        },
        onError: error => {console.log(error)},
    })

    const translations = {
        categoryClassifier: CategoryClassifierTitle,
    }

    useEffect(() => {
        if (isOpen) {
            loadCategoryData({ variables: { data: {
                dv: 1,
                sender: getClientSideSenderInfo(),
                where: {
                    organization: organizationId,
                    dateFrom: dateRange[0].toISOString(),
                    dateTo: dateRange[1].toISOString(),
                    propertyIds,
                },
                groupBy: { aggregatePeriod: 'day' },
                entities: ['ticketByCategory'],
            } } })
        }
    }, [isOpen, loadCategoryData, organizationId, dateRange, propertyIds])

    const chart = useMemo(() => (
        <TicketChartView
            data={localData}
            viewMode='bar'
            mapperInstance={TicketByCategoryDataMapper}
            chartConfig={{ chartOptions: { height: CHART_CONTAINER_HEIGHT }, animationEnabled: true }}
            loading={loading}
        />
    ), [localData, loading])

    return (
        <>
            <Row gutter={[0, 16]}>
                <Col span={24}>
                    <Typography.Title level={3}>{TicketTitle} {TicketsByCategory.toLowerCase()}</Typography.Title>
                </Col>
                <Col span={24} onClick={open}>
                    <TicketChartView
                        data={data}
                        viewMode='bar'
                        mapperInstance={TicketByCategoryDataMapper}
                        chartConfig={{ chartOptions: { height: CHART_CONTAINER_HEIGHT }, animationEnabled: true }}
                    />
                </Col>
            </Row>
            <PopupChartView>
                <Row gutter={[24, 40]}>
                    <Col span={12}>
                        <DateRangeFilter disabled={loading} />
                    </Col>
                    <Col span={12}>
                        {SearchInput}
                    </Col>
                    <Col span={24}>
                        {chart}
                    </Col>
                    <Col span={24}>
                        <CustomListView
                            viewMode='bar'
                            translations={translations}
                            mapperInstance={TicketByCategoryDataMapper}
                            data={localData}
                        />
                    </Col>
                </Row>
            </PopupChartView>
        </>
    )
}

export { TicketByCategoryChart }
