import { TableColumnsType, TableProps } from 'antd'

export type viewModeTypes = 'bar' | 'line' | 'pie'
interface IGetChartConfig {
    (viewMode: viewModeTypes, data: unknown): {
        legend: string[],
        series: unknown[],
        axisData: {
            xAxis: { type: string, data: null | unknown[] },
            yAxis: { type: string, data: null | unknown[] }
        },
        tooltip: {
            trigger: string,
            axisPointer: { type: string }
        }
    }
}
type restTableOptions = {
    translations: unknown;
    filters?: unknown;
}

export type AnalyticsDataType = Record<string, Record<string, number>>

interface IGetTableConfig {
    (viewMode: viewModeTypes, data: AnalyticsDataType, restOptions: restTableOptions): {
        dataSource: TableProps<any>['dataSource'], tableColumns: TableColumnsType
    }
}
type chartConfigMapType = {
    bar?: { chart: IGetChartConfig; table: IGetTableConfig; };
    line?: { chart: IGetChartConfig; table: IGetTableConfig; };
    pie?: { chart: IGetChartConfig; table: IGetTableConfig; };
}

class TicketChart {
    constructor (private chartConfigMap: chartConfigMapType) {}

    public getChartConfig: IGetChartConfig = (viewMode, data) => {
        return this.chartConfigMap[viewMode]['chart'](viewMode, data)
    }

    public getTableConfig: IGetTableConfig = (viewMode, data, restOptions) => {
        return this.chartConfigMap[viewMode]['table'](viewMode, data, restOptions)
    }

}

export default TicketChart
