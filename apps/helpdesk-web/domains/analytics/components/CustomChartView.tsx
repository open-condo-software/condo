import { Skeleton } from 'antd'
import get from 'lodash/get'
import dynamic from 'next/dynamic'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { getChartOptions } from '@condo/domains/analytics/utils/helpers'

import { ChartConfigResult } from './TicketChart'

import type { CustomChartViewType, CustomChartMapType } from './CustomChart'
import type { BaseSimpleChart } from '@condo/domains/common/components/BaseChart'
import type { RowProps } from 'antd'
import type { EChartsReactProps } from 'echarts-for-react'

type BaseDataType = Array<Record<string, unknown>>

interface ICustomChartViewProps<
    DataType,
    ChartType extends CustomChartViewType,
    MapperType extends BaseSimpleChart<CustomChartMapType<DataType>, ChartConfigResult, CustomChartViewType, DataType>,
> {
    data: null | DataType
    viewMode: ChartType
    mapperInstance: MapperType
    loading?: boolean
    chartConfig: { animationEnabled: boolean, chartOptions?: EChartsReactProps['opts'] }
}

const ReactECharts = dynamic(
    () => import('echarts-for-react').then((mod) => mod.default),
    { ssr: false, loading: () => null }
)

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

const EMPTY_CONTAINER_STYLE: React.CSSProperties = {
    height: '300px',
    display: 'flex',
    justifyContent: 'start',
    alignItems: 'start',
}

export const CHART_CONTAINER_HEIGHT = 300
export const CHART_CONTAINER_BIG_HEIGHT = 350

export const CHART_CONTENT_ROW_GUTTER: RowProps['gutter'] = [0, 16]

const CustomChartView =
    <
        DataType extends BaseDataType,
        ChartType extends CustomChartViewType,
        MapperType extends BaseSimpleChart<CustomChartMapType<DataType>, ChartConfigResult, CustomChartViewType, DataType>,
    >(props: ICustomChartViewProps<DataType, ChartType, MapperType>) => {
        const { viewMode, data, mapperInstance, chartConfig, loading } = props

        const intl = useIntl()
        const NoData = intl.formatMessage({ id: 'NoData' })

        let legend = [], tooltip = null

        if (data === null || loading) {
            return <Skeleton loading active paragraph={{ rows: 12 }} />
        }

        if (data.length === 0) {
            return (
                <div style={EMPTY_CONTAINER_STYLE}>
                    <Typography.Text>{NoData}</Typography.Text>
                </div>
            )
        }

        const mapperResult = mapperInstance.getChartConfig(viewMode, data)
        legend = mapperResult.legend
        tooltip = mapperResult.tooltip

        const { opts, option } = getChartOptions({
            legend,
            tooltip,
            color: COLOR_SET,
            viewMode: viewMode,
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

export { CustomChartView }
