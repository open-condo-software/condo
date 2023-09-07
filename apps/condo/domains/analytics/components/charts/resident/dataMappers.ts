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

interface IResidentChartCard {
    (props: ResidentChartCardProps): React.ReactElement
}

const ResidentByPropertyDataMapper = (residentsTitle: string): ResidentChart => new ResidentChart({
    pie: {
        chart: (viewMode, data) => {
            const series: Array<EchartsSeries> = [{
                name: residentsTitle,
                data: data.slice(0, TOP_VALUES).map(resident => ({ value: resident.count, name: resident.address })),
                radius: '75%',
                type: viewMode,
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
        table: (_, data, restTableOptions) => {
            const dataSource = []
            const tableColumns = Object.entries(restTableOptions.translations).map(([key, title]) => ({
                key,
                title,
                dataIndex: key,
            }))

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
                tableColumns,
            }
        },
    },
})

export { ResidentByPropertyDataMapper }
export type { IResidentChartCard }
