import type { ChartConfigResult, AxisData } from './TicketChart'
import type { IGetBaseChartConfig } from '@condo/domains/common/components/BaseChart'

export type CustomChartViewType = 'line' | 'bar' | 'pie'

export interface IGetChartConfig<T> extends IGetBaseChartConfig<CustomChartViewType, T, ChartConfigResult> {
    (viewMode: CustomChartViewType, data: T): {
        legend, series,
        axisData?: { xAxis: Array<AxisData> | AxisData, yAxis: Array<AxisData> | AxisData },
        tooltip?: { trigger, axisPointer: { type }, show?: boolean }
    }
}

export type CustomChartMapType<T> = {
    line?: { chart: IGetChartConfig<T> }
    bar?: { chart: IGetChartConfig<T> }
    pie?: { chart: IGetChartConfig<T> }
}
