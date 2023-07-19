export interface IGetBaseChartConfig<ViewModeType, ResultDataType, BaseChartConfigResult> {
    (viewMode: ViewModeType, data: ResultDataType): BaseChartConfigResult
}

export interface IGetBaseTableConfig<ViewModeType, ResultDataType, RestTableOptionsType, BaseTableConfigResult> {
    (viewMode: ViewModeType, data: ResultDataType, restTableOptions: RestTableOptionsType): BaseTableConfigResult
}

export abstract class BaseSimpleChart<ChartConfigType, ChartConfigResult, ViewMode, ResultData>{
    constructor (protected chartConfigMap: ChartConfigType) {}

    abstract getChartConfig (viewMode: ViewMode, data: ResultData): ChartConfigResult
}

abstract class BaseChart <ChartConfigType, ChartConfigResult, TableConfigResult, ViewMode, ResultData, RestTableOptions>
    extends BaseSimpleChart<ChartConfigType, ChartConfigResult, ViewMode, ResultData> {

    abstract getTableConfig (viewMode: ViewMode, data: ResultData, restTableOptions: RestTableOptions): TableConfigResult
}

export default BaseChart
