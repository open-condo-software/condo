export type viewModeTypes = 'bar' | 'line' | 'pie'

type chartConfigMapType = {
    bar?: IGetChartConfig;
    line?: IGetChartConfig;
    pie?: IGetChartConfig;
}

interface IGetChartConfig {
    (viewMode: viewModeTypes, data: unknown): { legend: string[], axisLabels: string[], series: unknown[] }
}

class TicketChart {
    constructor (private chartConfigMap: chartConfigMapType) {}

    public getChartConfig: IGetChartConfig = (viewMode, data) => {
        return this.chartConfigMap[viewMode](viewMode, data)
    }


}

export {
    TicketChart,
}
