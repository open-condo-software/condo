import { EchartsSeries } from '@condo/domains/analytics/components/TicketChart'

import ResidentChart from './ResidentChart'

import type { ResidentDataType } from './ResidentChart'

const TOP_VALUES = 9

interface IResidentChartCard {
    ({ data }: { data: ResidentDataType }): React.ReactElement
}

const ResidentByPropertyDataMapper = (residentsTitle: string): ResidentChart => new ResidentChart({
    pie: {
        chart: (viewMode, data) => {
            const series: Array<EchartsSeries> = [{
                name: residentsTitle,
                data: data.slice(0, TOP_VALUES).map(resident => ({ value: resident.count, name: resident.address })),
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

export { ResidentByPropertyDataMapper }
export type { IResidentChartCard }
