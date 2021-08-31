import React from 'react'
import { useIntl } from '@core/next/intl'
import { Skeleton, Typography } from 'antd'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import ReactECharts from 'echarts-for-react'
import TicketChart, { AnalyticsDataType, ViewModeTypes } from '@condo/domains/ticket/components/TicketChart'
import { CHART_COLOR_SET } from '@condo/domains/common/constants/style'
import { fontSizes } from '@condo/domains/common/constants/style'

export interface ITicketAnalyticsPageWidgetProps {
    data: null | AnalyticsDataType
    viewMode: ViewModeTypes
    loading?: boolean
    mapperInstance: TicketChart
}

interface ITicketAnalyticsPageChartProps extends ITicketAnalyticsPageWidgetProps {
    onChartReady?: () => void
    chartConfig: {
        animationEnabled: boolean
        chartOptions?: ReactECharts['props']['opts']
    }
}

const TicketChartView: React.FC<ITicketAnalyticsPageChartProps> = ({
    children,
    data,
    viewMode,
    loading = false,
    onChartReady,
    chartConfig,
    mapperInstance,
}) => {
    const intl = useIntl()
    const NoData = intl.formatMessage({ id: 'NoData' })
    if (data === null || loading) {
        return <Skeleton loading={loading} active paragraph={{ rows: 12 }} />
    }
    const { animationEnabled, chartOptions } = chartConfig
    const { series, legend, axisData, tooltip } = mapperInstance.getChartConfig(viewMode, data)
    const option = {
        animation: animationEnabled,
        color: CHART_COLOR_SET,
        tooltip,
        legend: {
            data: legend,
            x: 'left',
            top: 10,
            padding: [5, 135, 0, 0],
            icon: 'circle',
            itemWidth: 7,
            itemHeight: 7,
            itemGap: 28,
            textStyle: {
                fontSize: fontSizes.content,
            },
        },
        grid: {
            left: 0,
            right: 10,
            bottom: 0,
            containLabel: true,
            borderWidth: 1,
        },
        ...axisData,
        series,
    }

    const isEmptyDataSet = Object.values(data).every(ticketStatus => {
        if (viewMode === 'line') {
            return isEmpty(ticketStatus)
        }
        return Object.values(ticketStatus).every(count => count === 0)
    }) && !loading
    const chartHeight = get(chartOptions, 'height', 'auto')
    const chartStyle = {}
    if (chartHeight !== 'auto') {
        chartStyle['height'] = chartHeight
    }

    if (viewMode === 'bar' && chartHeight === 'auto') {
        const axisLabels = get(axisData, 'yAxis.data')
        if (axisLabels && axisLabels.length > 5) {
            chartStyle['height'] = axisLabels.length * 50
        }
    }

    return <Typography.Paragraph style={{ position: 'relative' }}>
        {isEmptyDataSet ? (
            <Typography.Paragraph>
                <BasicEmptyListView>
                    <Typography.Text>{NoData}</Typography.Text>
                </BasicEmptyListView>
                {children}
            </Typography.Paragraph>
        ) : (
            <>
                <ReactECharts
                    opts={{ ...chartOptions, renderer: 'svg', height: chartHeight }}
                    onChartReady={onChartReady}
                    notMerge
                    style={{ ...chartStyle }}
                    option={option}/>
                {children}
            </>
        )}

    </Typography.Paragraph>
}

export default TicketChartView
