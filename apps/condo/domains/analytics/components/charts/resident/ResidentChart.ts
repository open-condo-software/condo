import { BaseSimpleChart } from '@condo/domains/common/components/BaseChart'

import type { ResidentGroupedCounter } from '@app/condo/schema'
import type { CustomChartViewType, CustomChartMapType } from '@condo/domains/analytics/components/CustomChart'
import type { ChartConfigResult } from '@condo/domains/analytics/components/TicketChart'

type ResidentDataType = Array<ResidentGroupedCounter>

class ResidentChart extends BaseSimpleChart<
CustomChartMapType<ResidentDataType>, ChartConfigResult, CustomChartViewType, ResidentDataType
> {
    getChartConfig (viewMode: CustomChartViewType, data: ResidentDataType): ChartConfigResult {
        return this.chartConfigMap[viewMode]['chart'](viewMode, data)
    }
}

export default ResidentChart
export type { ResidentDataType }
