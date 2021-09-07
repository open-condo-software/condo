export interface IGetBaseChartConfig<ViewModeType, ResultDataType, BaseChartConfigResult> {
    (viewMode: ViewModeType, data: ResultDataType): BaseChartConfigResult
}

export interface IGetBaseTableConfig<ViewModeType, ResultDataType, RestTableOptionsType, BaseTableConfigResult> {
    (viewMode: ViewModeType, data: ResultDataType, restTableOptions: RestTableOptionsType): BaseTableConfigResult
}

abstract class BaseChart<ChartConfigType, ChartConfigResult, TableConfigResult> {
    constructor(protected chartConfigMap: ChartConfigType) {}

    abstract getChartConfig(viewMode, data): ChartConfigResult
    abstract getTableConfig(viewMode, data, restTableOptions): TableConfigResult
}

export default BaseChart
