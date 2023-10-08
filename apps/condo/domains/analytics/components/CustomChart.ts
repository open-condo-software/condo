import type { ChartConfigResult, AxisData } from './TicketChart'
import type { IGetBaseChartConfig, IGetBaseTableConfig } from '@condo/domains/common/components/BaseChart'
import type { TableColumnsType, TableProps } from 'antd'


export type CustomChartViewType = 'line' | 'bar' | 'pie'

export interface IGetChartConfig<T> extends IGetBaseChartConfig<CustomChartViewType, T, ChartConfigResult> {
    (viewMode: CustomChartViewType, data: T): {
        legend, series,
        axisData?: { xAxis: Array<AxisData> | AxisData, yAxis: Array<AxisData> | AxisData },
        tooltip?: { trigger, axisPointer: { type }, show?: boolean }
    }
}

type TableConfigResult<T> = {
    dataSource: TableProps<T[]>['dataSource']
    tableColumns: TableColumnsType
}

export interface IGetTableConfig<T> extends IGetBaseTableConfig<CustomChartViewType, T, Record<string, string>, TableConfigResult<T>> {
    (viewMode, data: T[], restOptions): {
        dataSource, tableColumns
    }
}

export type CustomChartMapType<T> = {
    line?: { chart: IGetChartConfig<T>, table?: IGetTableConfig<T> }
    bar?: { chart: IGetChartConfig<T>, table?: IGetTableConfig<T> }
    pie?: { chart: IGetChartConfig<T>, table?: IGetTableConfig<T> }
}
