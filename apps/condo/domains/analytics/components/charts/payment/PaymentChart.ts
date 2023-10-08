import BaseChart from '@condo/domains/common/components/BaseChart'

import type { PaymentGroupedCounter } from '@app/condo/schema'
import type { CustomChartViewType, CustomChartMapType } from '@condo/domains/analytics/components/CustomChart'
import type { ChartConfigResult } from '@condo/domains/analytics/components/TicketChart'
import type { TableColumnsType, TableProps } from 'antd'

type PaymentDataType = Array<PaymentGroupedCounter>

type TableConfigResult = {
    dataSource: TableProps<PaymentDataType>['dataSource']
    tableColumns: TableColumnsType
}

class PaymentChart extends BaseChart<
CustomChartMapType<PaymentDataType>, ChartConfigResult, TableConfigResult, CustomChartViewType, PaymentDataType, Record<string, string>
> {
    getChartConfig (viewMode: CustomChartViewType, data: PaymentDataType): ChartConfigResult {
        return this.chartConfigMap[viewMode]['chart'](viewMode, data)
    }

    getTableConfig (viewMode, data, restTableOptions): TableConfigResult {
        return this.chartConfigMap[viewMode]['table'](viewMode, data, restTableOptions)
    }
}

export default PaymentChart
export type { PaymentDataType }
