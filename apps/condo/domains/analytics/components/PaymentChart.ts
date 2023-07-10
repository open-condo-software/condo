import { Payment } from '@app/condo/schema'

import BaseChart, { IGetBaseChartConfig } from '@condo/domains/common/components/BaseChart'

import { ChartConfigResult, AxisData } from './TicketChart'


export type PaymentDataType = Array<Pick<Payment, 'id' | 'amount' | 'createdAt'>>
export type PaymentChartType = 'bar' | 'pie'

interface IGetChartConfig extends IGetBaseChartConfig<PaymentChartType, PaymentDataType, ChartConfigResult> {
    (viewMode: 'bar', data: PaymentDataType): {
        legend,
        series,
        axisData?: { xAxis: Array<AxisData> | AxisData, yAxis: Array<AxisData> | AxisData },
        tooltip?: { trigger, axisPointer: { type }, show?: boolean },
    }
}

type ChartConfigMapType = {
    barSummary?: { chart: IGetChartConfig }
    bar?: { chart: IGetChartConfig }
    pie?: { chart: IGetChartConfig }
}

class PaymentChart extends BaseChart<ChartConfigMapType, ChartConfigResult, unknown, PaymentChartType, PaymentDataType, unknown> {
    getChartConfig (viewMode: PaymentChartType, data: PaymentDataType): ChartConfigResult {
        return this.chartConfigMap[viewMode]['chart'](viewMode, data)
    }

    getTableConfig (viewMode: PaymentChartType, data: PaymentDataType, restTableOptions: unknown): unknown {
        return undefined
    }
}

export default PaymentChart
