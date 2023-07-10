import { Skeleton } from 'antd'
import ReactECharts from 'echarts-for-react'
import get from 'lodash/get'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { getChartOptions } from '@condo/domains/analytics/utils/helpers'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'

import PaymentChart from './PaymentChart'

import type { PaymentChartType, PaymentDataType } from './PaymentChart'
import type { ViewModeTypes } from './TicketChart'

interface IPaymentChartViewProps {
    data: null | PaymentDataType
    viewMode: PaymentChartType
    mapperInstance: PaymentChart
    loading?: boolean
    chartConfig: { animationEnabled: boolean, chartOptions?: ReactECharts['props']['opts'] }
}

const COLOR_SET = [
    colors.purple['7'],
    colors.purple['5'],
    colors.blue['7'],
    colors.blue['5'],
    colors.green['7'],
    colors.green['5'],
    colors.teal['5'],
    colors.cyan['5'],
    colors.cyan['3'],
]

export const PaymentChartView: React.FC<IPaymentChartViewProps> = (props) => {
    const { viewMode, data, mapperInstance, chartConfig } = props

    const intl = useIntl()
    const NoData = intl.formatMessage({ id: 'NoData' })

    let legend = [], tooltip = null

    if (data === null) {
        return <Skeleton loading active paragraph={{ rows: 12 }} />
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
        color: COLOR_SET,
        viewMode: viewMode as ViewModeTypes,
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
