import { TicketGroupedCounter } from '@app/condo/schema'
import { TableColumnsType, TableProps } from 'antd'

import BaseChart, { IGetBaseChartConfig, IGetBaseTableConfig } from '@condo/domains/common/components/BaseChart'
export type TicketSelectTypes = 'all' | 'default' | 'payable' | 'emergency' | 'warranty'
export type ViewModeTypes = 'bar' | 'line' | 'pie'

export type AnalyticsDataType = Record<string, Record<string, number>>

export type EchartsSeries = {
    type: ViewModeTypes
    name?: string
    stack?: string
    smooth?: boolean
    barMaxWidth?: number
    data: unknown[]
    label?: {
        show?: boolean
        position?: 'top' | 'bottom' | 'left' | 'right' | 'insideLeft'
        padding?: number | number[]
        width?: number
        height?: number
        formatter?: unknown
        normal?: Record<string, unknown>
    }
    emphasis?: {
        focus: string
        blurScope: string
    }
    symbol?: string
    top?: number | string
    left?: number | string
    bottom?: number | string
    right?: number | string
    labelLayout?: unknown
    yAxisIndex?: number
    radius?: string
    center?: Array<string>
    itemStyle?: Record<string, unknown>
    color?: string
}

export type AxisData = {
    type: string,
    data: null | string[],
    axisLabel?: Record<string, unknown>
}

export type ChartConfigResult = {
    legend: string[],
    series: EchartsSeries[],
    axisData?: {
        xAxis: Array<AxisData> | AxisData,
        yAxis: Array<AxisData> | AxisData
    },
    tooltip?: {
        trigger: string,
        axisPointer: { type: string }
        show?: boolean
    },
    color?: string[]
}

interface IGetChartConfig extends IGetBaseChartConfig<ViewModeTypes, TicketGroupedCounter[], ChartConfigResult>{
    (viewMode: ViewModeTypes, data: TicketGroupedCounter[]): {
        legend,
        series,
        axisData?: {
            xAxis: Array<AxisData> | AxisData,
            yAxis: Array<AxisData> | AxisData
        },
        tooltip?: {
            trigger,
            axisPointer: { type },
            show?: boolean
        }
        color?: string[]
    }
}

type RestTableOptionsType = {
    translations: unknown;
    filters?: unknown;
}
type TableConfigResult = {
    dataSource: TableProps<TicketGroupedCounter[]>['dataSource']
    tableColumns: TableColumnsType
}

interface IGetTableConfig extends IGetBaseTableConfig<ViewModeTypes, TicketGroupedCounter[], RestTableOptionsType,
TableConfigResult>{
    (viewMode, data: TicketGroupedCounter[], restOptions): {
        dataSource, tableColumns
    }
}

export type ChartConfigMapType = {
    bar?: { chart: IGetChartConfig; table: IGetTableConfig; };
    line?: { chart: IGetChartConfig; table: IGetTableConfig; };
    pie?: { chart: IGetChartConfig; table: IGetTableConfig; };
}

class TicketChart extends BaseChart<ChartConfigMapType, ChartConfigResult, TableConfigResult, ViewModeTypes,
TicketGroupedCounter[], RestTableOptionsType>{
    getChartConfig: IGetChartConfig = (viewMode, data) => {
        return this.chartConfigMap[viewMode]['chart'](viewMode, data)
    }

    getTableConfig: IGetTableConfig = (viewMode, data, restOptions) => {
        return this.chartConfigMap[viewMode]['table'](viewMode, data, restOptions)
    }
}

export default TicketChart
