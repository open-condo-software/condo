import { Dayjs } from 'dayjs'

import { EchartsSeries } from '@condo/domains/analytics/components/TicketChart'

import ResidentChart from './ResidentChart'

import type { ResidentDataType } from './ResidentChart'

const TOP_VALUES = 9

type ResidentChartCardProps = {
    data: ResidentDataType
    organizationId?: string
    dateRange?: [Dayjs, Dayjs]
}

type ResidentChartCardType = (props: ResidentChartCardProps) => React.ReactElement

const ResidentByPropertyDataMapper = (residentsTitle: string): ResidentChart => new ResidentChart({
    pie: {
        chart: (viewMode, data) => {
            const totalCount = data.reduce((prev, curr) => prev + Number(curr.count), 0)

            const series: Array<EchartsSeries> = [{
                type: viewMode,
                name: residentsTitle,
                radius: '75%',
                label: {
                    show: true,
                    formatter: ({ value }) => totalCount > 0 ? (Number(value) / totalCount * 100).toFixed(0) + '%' : '-',
                },
                data: data.slice(0, TOP_VALUES).map(resident => ({ value: resident.count, name: resident.address })),
            }]

            return {
                tooltip: { trigger: 'item', axisPointer: { type: 'none' } },
                axisData: {
                    xAxis: { type: 'value', data: null, boundaryGap: [0, 0.02] },
                    yAxis: { type: 'category', data: null, axisLabel: { show: false } },
                },
                series,
                legend: [],
            }
        },
        table: (_, data, restTableOptions) => {
            const dataSource = []
            const totalCount = data.reduce((prev, curr) => prev + Number(curr.count), 0)

            data.forEach(({ count, address }) => {
                const percent = totalCount > 0 ? (count / totalCount * 100).toFixed(0) + '%' : '-'
                dataSource.push({
                    percent,
                    count,
                    address,
                })
            })

            return {
                dataSource,
                tableColumns: Object.entries(restTableOptions.translations as Record<string, string>).map(([key, title]) => ({
                    key,
                    title,
                    dataIndex: key,
                })),
            }
        },
    },
})

export { ResidentByPropertyDataMapper }
export type { ResidentChartCardType }
