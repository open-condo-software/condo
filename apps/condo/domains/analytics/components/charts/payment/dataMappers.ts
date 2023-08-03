import dayjs from 'dayjs'
import groupBy from 'lodash/groupBy'

import { colors } from '@open-condo/ui/dist/colors'

import PaymentChart from './PaymentChart'

import type { PaymentDataType } from './PaymentChart'
import type { EchartsSeries } from '@condo/domains/analytics/components/TicketChart'

const TOP_VALUES = 9

interface IPaymentChartCard {
    ({ data }: { data: PaymentDataType }): React.ReactElement
}

const PaymentByPropertyDataMapper = (paidTitle: string): PaymentChart => new PaymentChart({
    pie: {
        chart: (viewMode, data) => {
            const createdByGroup = groupBy(data, 'createdBy')

            const series: Array<EchartsSeries> = [{
                name: paidTitle,
                data: Object.entries(createdByGroup).map(([groupLabel, dataObj]) => ({
                    value: dataObj.reduce((p, c) => p + Number(c.sum), 0),
                    name: groupLabel,
                })).sort((a, b) => b.value - a.value).slice(0, TOP_VALUES),
                radius: '75%',
                type: 'pie',
                label: { show: true, formatter: (e) =>  e.percent + '%' },
            }]
            return {
                legend: [],
                tooltip: { trigger: 'item', axisPointer: { type: 'none' } },
                axisData: {
                    yAxis: { type: 'category', data: null, axisLabel: { show: false } },
                    xAxis: { type: 'value', data: null, boundaryGap: [0, 0.02] },
                },
                series,
            }
        },
    },
})

const PaymentReceiptDataMapper = (chargedTitle: string, paidTitle: string): PaymentChart => new PaymentChart({
    bar: {
        chart: (viewMode, dataset) => {
            const paymentsGroup = groupBy(dataset[0], 'dayGroup')

            const series: Array<EchartsSeries> = [
                {
                    name: chargedTitle,
                    data: dataset[1].map(receipt => [receipt.dayGroup, Number(receipt.sum).toFixed(2)]),
                    type: viewMode,
                    label: { show: true, position: 'top' },
                    barMaxWidth: 40,
                    color: colors.gray['7'],
                },
                {
                    name: paidTitle,
                    data: Object.entries(paymentsGroup).map(([groupLabel, dataObj]) => {
                        return [groupLabel, dataObj.reduce((p, c) => p + parseFloat(c.sum), 0).toFixed(2)]
                    }),
                    type: viewMode,
                    label: { show: true, position: 'top' },
                    barMaxWidth: 40,
                    color: colors.green['7'],
                },
            ]

            return {
                legend: [chargedTitle, paidTitle],
                tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                axisData: {
                    yAxis: { type: 'value', data: null, boundaryGap: [0, 0.05] },
                    xAxis: {
                        type: 'category',
                        data: Array.from(new Set(...dataset.map(e => e.map(q => q.dayGroup)))) as Array<string>,
                        axisLabel: {
                            formatter: (value) => dayjs(value, 'DD.MM.YYYY').format('MMM, YYYY'),
                        },
                    },
                },
                series,
            }
        },
    },
})

const PaymentTotalDataMapper = (sumTitle: string, paymentCountTitle: string): PaymentChart => new PaymentChart({
    bar: {
        chart: (viewMode, data) => {
            const totalGroup = groupBy(data, 'dayGroup')
            const paymentsCount = Object.entries(totalGroup).map(([groupLabel, dataObj]) => {
                return [groupLabel, dataObj.reduce((p, c) => p + Number(c.count), 0)]
            })
            const series: Array<EchartsSeries> = [
                {
                    name: sumTitle,
                    data: Object.entries(totalGroup).map(([groupLabel, dataObj]) => {
                        return [groupLabel, dataObj.reduce((p, c) => p + parseFloat(c.sum), 0).toFixed(2)]
                    }),
                    type: 'bar',
                    label: { show: true, position: 'top' },
                    color: colors.green['7'],
                    barMaxWidth: 40,
                },
                {
                    name: paymentCountTitle,
                    data: paymentsCount,
                    type: 'line',
                    itemStyle: {
                        opacity: 0,
                    },
                    color: 'transparent',
                },
            ]

            return {
                legend: [],
                tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                axisData: {
                    yAxis: { type: 'value', data: null, boundaryGap: [0, 0.02] },
                    xAxis: {
                        type: 'category',
                        data: null,
                        axisLabel: {
                            formatter: (value) => dayjs(value, 'DD.MM.YYYY').format('MMM, YYYY'),
                        },
                    },
                },
                series,
            }
        },
    },
})


export { PaymentByPropertyDataMapper, PaymentReceiptDataMapper, PaymentTotalDataMapper }
export type { IPaymentChartCard }
