export interface IGetBaseChartConfig<ViewModeType, ResultDataType, BaseChartConfigResult> {
    (viewMode: ViewModeType, data: ResultDataType): BaseChartConfigResult
}

export interface IGetBaseTableConfig<ViewModeType, ResultDataType, RestTableOptionsType, BaseTableConfigResult> {
    (viewMode: ViewModeType, data: ResultDataType, restTableOptions: RestTableOptionsType): BaseTableConfigResult
}

abstract class BaseChart<ChartConfigType, ChartConfigResult, TableConfigResult, ViewMode, ResultData, RestTableOptions> {
    constructor(protected chartConfigMap: ChartConfigType) {}

    abstract getChartConfig(viewMode: ViewMode, data: ResultData): ChartConfigResult
    abstract getTableConfig(viewMode: ViewMode, data: ResultData, restTableOptions: RestTableOptions): TableConfigResult
}

export default BaseChart
