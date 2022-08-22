import { TableColumnsType, TableProps } from 'antd'
import BaseChart, { IGetBaseChartConfig, IGetBaseTableConfig } from '@condo/domains/common/components/BaseChart'
import { TicketGroupedCounter } from '@app/condo/schema'
export type TicketSelectTypes = 'all' | 'default' | 'paid' | 'emergency' | 'warranty'
export type ViewModeTypes = 'bar' | 'line' | 'pie'

export type AnalyticsDataType = Record<string, Record<string, number>>

export type EchartsSeries = {
    type: ViewModeTypes
    name?: string
    stack?: string
    data: unknown[]
    label?: {
        show?: boolean
        position?: 'top' | 'bottom' | 'left' | 'right'
        padding?: number | number[]
        width?: number
        height?: number
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
}

export type ChartConfigResult = {
    legend: string[],
    series: EchartsSeries[],
    axisData?: {
        xAxis: { type: string, data: null | string[] },
        yAxis: { type: string, data: null | string[] }
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
            xAxis: { type, data },
            yAxis: { type, data }
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
