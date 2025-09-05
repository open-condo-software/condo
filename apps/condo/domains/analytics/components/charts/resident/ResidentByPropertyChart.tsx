import { Row, Col } from 'antd'
import get from 'lodash/get'
import React, { useMemo, useState, useEffect } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Tooltip } from '@open-condo/ui'

import {
    CustomChartView,
    CHART_CONTAINER_HEIGHT,
    CHART_CONTENT_ROW_GUTTER,
} from '@condo/domains/analytics/components/CustomChartView'
import { CustomListView } from '@condo/domains/analytics/components/CustomListView'
import { GET_OVERVIEW_DASHBOARD_MUTATION } from '@condo/domains/analytics/gql'
import { usePropertyFilter, useDateRangeFilter } from '@condo/domains/analytics/hooks/useDashboardFilters'
import { useDetailChartView } from '@condo/domains/analytics/hooks/useDetailChartView'

import { ResidentByPropertyDataMapper } from './dataMappers'

import type { ResidentChartCardType } from './dataMappers'

const ResidentByPropertyChart: ResidentChartCardType = ({ data, organizationId }) => {
    const intl = useIntl()
    const ChartTitle = intl.formatMessage({ id: 'pages.reports.residentsTitle' })
    const ResidentTitle = intl.formatMessage({ id: 'global.section.contacts' })
    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const CountTitle = intl.formatMessage({ id: 'global.count' })
    const ResidentColumnTitle = intl.formatMessage({ id: 'pages.condo.analytics.residentsPercent.title' })
    const ResidentColumnDescription = intl.formatMessage({ id: 'pages.condo.analytics.residentsPercent.description' })

    const [localData, setLocalData] = useState([])

    const { values: propertyIds, SearchInput } = usePropertyFilter({ organizationId })
    const { dateRange } = useDateRangeFilter()
    const { open, isOpen, PopupChartView, errorFallback } = useDetailChartView({ title: ChartTitle })
    const [loadResidentData, { loading }] = useLazyQuery(GET_OVERVIEW_DASHBOARD_MUTATION, {
        onCompleted: (response) => {
            setLocalData(get(response, 'result.overview.resident.residents', []))
        },
        onError: () => { errorFallback() },
    })

    const dataMapper = useMemo(() => ResidentByPropertyDataMapper(ResidentTitle), [ResidentTitle])

    const chart = useMemo(() => (
        <CustomChartView
            data={localData}
            viewMode='pie'
            chartConfig={{ chartOptions: { height: CHART_CONTAINER_HEIGHT }, animationEnabled: true }}
            mapperInstance={dataMapper}
            loading={loading}
        />
    ), [localData, loading, dataMapper])

    useEffect(() => {
        if (isOpen) {
            loadResidentData({
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
                        entities: ['resident'],
                    },
                },
            })
        }
    }, [propertyIds, organizationId, isOpen, loadResidentData, dateRange])

    const translations = {
        address: AddressTitle,
        count: CountTitle,
        percent: <Tooltip title={ResidentColumnDescription}>{ResidentColumnTitle}</Tooltip>,
    }

    return (
        <>
            <Row gutter={CHART_CONTENT_ROW_GUTTER}>
                <Col span={24}>
                    <Typography.Title level={3}>{ChartTitle}</Typography.Title>
                </Col>
                <Col span={24} onClick={open}>
                    <CustomChartView
                        data={data}
                        viewMode='pie'
                        chartConfig={{ chartOptions: { height: CHART_CONTAINER_HEIGHT }, animationEnabled: true }}
                        mapperInstance={dataMapper}
                    />
                </Col>
            </Row>
            <PopupChartView>
                <Col span={24}>
                    {SearchInput}
                </Col>
                <Col span={24}>
                    {chart}
                </Col>
                <Col span={24}>
                    <CustomListView
                        viewMode='pie'
                        mapperInstance={dataMapper}
                        data={localData}
                        translations={translations}
                    />
                </Col>
            </PopupChartView>
        </>
    )
}

export { ResidentByPropertyChart }
