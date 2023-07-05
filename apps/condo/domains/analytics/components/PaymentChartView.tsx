import { Skeleton } from 'antd'
import ReactECharts from 'echarts-for-react'
import get from 'lodash/get'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { getChartOptions } from '@condo/domains/analytics/utils/helpers'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { CHART_COLOR_SET } from '@condo/domains/common/constants/style'

import PaymentChart from './PaymentChart'

import type { PaymentChartType, PaymentDataType } from './PaymentChart'

interface IPaymentChartViewProps {
    data: null | PaymentDataType
    viewMode: PaymentChartType
    mapperInstance: PaymentChart
    loading: boolean
    chartConfig: { animationEnabled: boolean, chartOptions?: ReactECharts['props']['opts'] }
}

export const PaymentChartView: React.FC<IPaymentChartViewProps> = (props) => {
    const { viewMode, data, mapperInstance, loading, chartConfig } = props

    const intl = useIntl()
    const NoData = intl.formatMessage({ id: 'NoData' })

    let legend = [], tooltip = null

    if (data === null || loading) {
        return <Skeleton loading={loading} active paragraph={{ rows: 12 }} />
    }

    if (data.length === 0) {
        return (
            <BasicEmptyListView image='/dino/searching@2x.png'>
                <Typography.Text>{NoData}</Typography.Text>
            </BasicEmptyListView>
        )
    }

    const mapperResult = mapperInstance.getChartConfig(viewMode, data)
    legend = mapperResult.legend
    tooltip = mapperResult.tooltip

    const { opts, option } = getChartOptions({
        legend,
        tooltip,
        color: CHART_COLOR_SET,
        viewMode: 'bar',
        showTitle: false,
        chartOptions: chartConfig.chartOptions || {},
        animationEnabled: chartConfig.animationEnabled,
        series: mapperResult.series,
        axisData: mapperResult.axisData,
    })
    const chartStyle = { height: get(opts, 'height', 'auto') }

    return (
        <>
            <ReactECharts opts={opts} option={option} style={chartStyle} notMerge />
        </>
    )
}
