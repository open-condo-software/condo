import { TableColumnsType, TableProps } from 'antd'

import BaseChart, { BaseSimpleChart } from '@condo/domains/common/components/BaseChart'

import type { ResidentGroupedCounter } from '@app/condo/schema'
import type { CustomChartViewType, CustomChartMapType } from '@condo/domains/analytics/components/CustomChart'
import type { ChartConfigResult } from '@condo/domains/analytics/components/TicketChart'

type ResidentDataType = Array<ResidentGroupedCounter>

type TableConfigResult = {
    dataSource: TableProps<ResidentDataType>['dataSource']
    tableColumns: TableColumnsType
}

class ResidentChart extends BaseChart<
CustomChartMapType<ResidentDataType>, ChartConfigResult, TableConfigResult, CustomChartViewType, ResidentDataType, Record<string, string>
> {
    getChartConfig (viewMode: CustomChartViewType, data: ResidentDataType): ChartConfigResult {
        return this.chartConfigMap[viewMode]['chart'](viewMode, data)
    }

    getTableConfig (viewMode, data, restTableOptions): TableConfigResult {
        return this.chartConfigMap[viewMode]['table'](viewMode, data, restTableOptions)
    }
}

export default ResidentChart
export type { ResidentDataType }
