import { BaseSimpleChart } from '@condo/domains/common/components/BaseChart'

import type { PaymentGroupedCounter } from '@app/condo/schema'
import type { CustomChartViewType, CustomChartMapType } from '@condo/domains/analytics/components/CustomChart'
import type { ChartConfigResult } from '@condo/domains/analytics/components/TicketChart'

type PaymentDataType = Array<PaymentGroupedCounter>

class PaymentChart extends BaseSimpleChart<
CustomChartMapType<PaymentDataType>, ChartConfigResult, CustomChartViewType, PaymentDataType
> {
    getChartConfig (viewMode: CustomChartViewType, data: PaymentDataType): ChartConfigResult {
        return this.chartConfigMap[viewMode]['chart'](viewMode, data)
    }
}

export default PaymentChart
export type { PaymentDataType }
